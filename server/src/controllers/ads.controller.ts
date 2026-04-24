import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';
import { supabase } from '@/db/connect';
import { AppError } from '../middlewares/error.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';
import { normalizeMediaBatch } from '@client/utils/mediaNormalizer';
import { calculateRankingScore } from '@shared/constants/packageTypes';
import { AD_STATUS } from '@shared/constants/adStatus';

const AD_SELECT = `
  id, title, description, price, price_negotiable, status,
  package_type, is_featured, admin_boost, ranking_score, slug,
  views, published_at, expires_at, scheduled_at, rejection_reason,
  moderator_notes, created_at, updated_at, user_id,
  category:categories(id, name, slug),
  city:cities(id, name, province),
  media:ad_media(id, source_type, original_url, normalized_thumbnail_url, validation_status, sort_order),
  seller:users(id, full_name, is_verified, created_at)
`;

export async function listAds(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      search, category_id, city_id, package_type,
      min_price, max_price, sort = 'ranking',
      page = 1, limit = 20,
    } = req.query;

    let query = supabase
      .from('ads')
      .select(AD_SELECT, { count: 'exact' })
      .eq('status', AD_STATUS.PUBLISHED);

    if (search) query = query.ilike('title', `%${search}%`);
    if (category_id) query = query.eq('category_id', category_id as string);
    if (city_id) query = query.eq('city_id', city_id as string);
    if (package_type) query = query.eq('package_type', package_type as string);
    if (min_price) query = query.gte('price', Number(min_price));
    if (max_price) query = query.lte('price', Number(max_price));

    const sortMap: Record<string, { col: string; asc: boolean }> = {
      ranking: { col: 'ranking_score', asc: false },
      newest: { col: 'created_at', asc: false },
      price_asc: { col: 'price', asc: true },
      price_desc: { col: 'price', asc: false },
    };
    const s = sortMap[sort as string] || sortMap['ranking'];
    query = query.order(s!.col, { ascending: s!.asc });

    const pageNum = Number(page);
    const limitNum = Math.min(Number(limit), 50);
    const from = (pageNum - 1) * limitNum;
    query = query.range(from, from + limitNum - 1);

    const { data, error, count } = await query;
    if (error) throw new AppError(error.message, 500);

    res.json({
      ads: data || [],
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil((count || 0) / limitNum),
    });
  } catch (err) { next(err); }
}

export async function getFeaturedAds(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabase
      .from('ads')
      .select(AD_SELECT)
      .eq('status', AD_STATUS.PUBLISHED)
      .eq('is_featured', true)
      .order('ranking_score', { ascending: false })
      .limit(12);

    if (error) throw new AppError(error.message, 500);
    res.json({ ads: data || [] });
  } catch (err) { next(err); }
}

export async function getAdBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const { data, error } = await supabase
      .from('ads')
      .select(AD_SELECT)
      .eq('slug', slug)
      .single();

    if (error || !data) throw new AppError('Ad not found', 404);

    // Increment views
    await supabase.from('ads').update({ views: (data.views || 0) + 1 }).eq('id', data.id);

    res.json({ ad: data });
  } catch (err) { next(err); }
}

export async function getMyAds(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabase
      .from('ads')
      .select(AD_SELECT)
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) throw new AppError(error.message, 500);
    res.json({ ads: data || [] });
  } catch (err) { next(err); }
}

export async function createAd(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { title, description, price, price_negotiable, category_id, city_id, package_type, media_urls = [] } = req.body;

    const slug = slugify(title, { lower: true, strict: true }) + '-' + uuidv4().slice(0, 8);
    const adId = uuidv4();

    const { data: ad, error } = await supabase
      .from('ads')
      .insert({
        id: adId,
        user_id: req.user!.id,
        title,
        description,
        price: price ? Math.round(price * 100) : null,
        price_negotiable: price_negotiable || false,
        category_id,
        city_id,
        package_type,
        status: AD_STATUS.DRAFT,
        slug,
        is_featured: false,
        admin_boost: 0,
        ranking_score: 0,
        views: 0,
      })
      .select()
      .single();

    if (error) throw new AppError('Failed to create ad: ' + error.message, 500);

    // Process media
    if (media_urls.length > 0) {
      const normalized = normalizeMediaBatch(media_urls);
      const mediaRows = normalized.map((m: any, i: number) => ({
        id: uuidv4(),
        ad_id: adId,
        source_type: m.source_type,
        original_url: m.original_url,
        normalized_thumbnail_url: m.normalized_thumbnail_url,
        validation_status: m.validation_status,
        sort_order: i,
      }));
      await supabase.from('ad_media').insert(mediaRows);
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      id: uuidv4(),
      user_id: req.user!.id,
      action: 'ad_created',
      resource_type: 'ad',
      resource_id: adId,
    });

    res.status(201).json({ ad });
  } catch (err) { next(err); }
}

export async function updateAd(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    // Verify ownership
    const { data: existing } = await supabase.from('ads').select('user_id, status').eq('id', id).single();
    if (!existing) throw new AppError('Ad not found', 404);
    if (existing.user_id !== req.user!.id) throw new AppError('Forbidden', 403);
    if (!['draft', 'rejected'].includes(existing.status)) {
      throw new AppError('Only draft or rejected ads can be edited', 400);
    }

    const { title, description, price, price_negotiable, category_id, city_id, package_type, media_urls } = req.body;

    const { data: ad, error } = await supabase
      .from('ads')
      .update({ title, description, price: price ? Math.round(price * 100) : null, price_negotiable, category_id, city_id, package_type, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);

    if (media_urls) {
      await supabase.from('ad_media').delete().eq('ad_id', id);
      if (media_urls.length > 0) {
        const normalized = normalizeMediaBatch(media_urls);
        const mediaRows = normalized.map((m: ReturnType<typeof normalizeMediaBatch>[0], i: number) => ({
          id: uuidv4(), ad_id: id, source_type: m.source_type,
          original_url: m.original_url, normalized_thumbnail_url: m.normalized_thumbnail_url,
          validation_status: m.validation_status, sort_order: i,
        }));
        await supabase.from('ad_media').insert(mediaRows);
      }
    }

    res.json({ ad });
  } catch (err) { next(err); }
}

export async function submitAd(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { data: ad } = await supabase.from('ads').select('user_id, status').eq('id', id).single();
    if (!ad) throw new AppError('Ad not found', 404);
    if (ad.user_id !== req.user!.id) throw new AppError('Forbidden', 403);
    if (ad.status !== AD_STATUS.DRAFT && ad.status !== AD_STATUS.REJECTED) {
      throw new AppError('Only draft/rejected ads can be submitted', 400);
    }

    await supabase.from('ads').update({ status: AD_STATUS.UNDER_REVIEW, updated_at: new Date().toISOString() }).eq('id', id);

    await supabase.from('ad_status_history').insert({
      id: uuidv4(), ad_id: id, from_status: ad.status,
      to_status: AD_STATUS.UNDER_REVIEW, changed_by: req.user!.id,
    });

    res.json({ message: 'Ad submitted for review' });
  } catch (err) { next(err); }
}

export async function getCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) throw new AppError(error.message, 500);
    res.json({ categories: data || [] });
  } catch (err) { next(err); }
}

export async function getCities(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabase.from('cities').select('*').order('name');
    if (error) throw new AppError(error.message, 500);
    res.json({ cities: data || [] });
  } catch (err) { next(err); }
}