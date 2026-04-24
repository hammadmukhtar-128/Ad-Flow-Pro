import { Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/db/connect';
import { AppError } from '../middlewares/error.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AD_STATUS } from '@shared/constants/adStatus';
import { PACKAGES } from '@shared/constants/packageTypes';
import { calculateRankingScore } from '@shared/constants/packageTypes';

export async function getAdminStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const [adsResult, usersResult, paymentsResult] = await Promise.all([
      supabase.from('ads').select('status, package_type'),
      supabase.from('users').select('id, role'),
      supabase.from('payments').select('amount, status'),
    ]);

    const ads = adsResult.data || [];
    const users = usersResult.data || [];
    const payments = paymentsResult.data || [];

    const total_revenue = payments
      .filter((p: any) => p.status === 'verified')
      .reduce((sum: any, p: any) => sum + (p.amount || 0), 0);

    res.json({
      total_ads: ads.length,
      published_ads: ads.filter((a: any) => a.status === 'published').length,
      pending_review: ads.filter((a: any) => a.status === 'under_review').length,
      expired_ads: ads.filter((a: any) => a.status === 'expired').length,
      total_revenue,
      pending_payments: payments.filter((p: any) => p.status === 'submitted').length,
      verified_payments: payments.filter((p: any) => p.status === 'verified').length,
      total_users: users.length,
      clients: users.filter((u: any) => u.role === 'client').length,
      moderators: users.filter((u: any) => u.role === 'moderator').length,
    });
  } catch (err) { next(err); }
}

export async function publishAd(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { scheduled_at } = req.body;

    const { data: ad } = await supabase.from('ads').select('status, package_type, user_id').eq('id', id).single();
    if (!ad) throw new AppError('Ad not found', 404);
    if (ad.status !== AD_STATUS.PAYMENT_VERIFIED && ad.status !== AD_STATUS.SCHEDULED) {
      throw new AppError('Ad payment must be verified before publishing', 400);
    }

    const pkg = PACKAGES[ad.package_type as keyof typeof PACKAGES];
    const publishedAt = new Date();
    const expiresAt = new Date(publishedAt.getTime() + pkg.durationDays * 24 * 60 * 60 * 1000);

    const rankingScore = calculateRankingScore({
      packageWeight: pkg.weight,
      isFeatured: false,
      adminBoost: 0,
      isVerifiedSeller: false,
      publishedAt,
    });

    if (scheduled_at) {
      await supabase.from('ads').update({
        status: AD_STATUS.SCHEDULED,
        scheduled_at,
        updated_at: new Date().toISOString(),
      }).eq('id', id);

      await supabase.from('ad_status_history').insert({
        id: uuidv4(), ad_id: id,
        from_status: ad.status, to_status: AD_STATUS.SCHEDULED,
        changed_by: req.user!.id,
        note: `Scheduled for ${scheduled_at}`,
      });

      return res.json({ message: `Ad scheduled for ${scheduled_at}` });
    }

    await supabase.from('ads').update({
      status: AD_STATUS.PUBLISHED,
      published_at: publishedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      ranking_score: rankingScore,
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    await supabase.from('ad_status_history').insert({
      id: uuidv4(), ad_id: id,
      from_status: ad.status, to_status: AD_STATUS.PUBLISHED,
      changed_by: req.user!.id, note: 'Published by admin',
    });

    await supabase.from('notifications').insert({
      id: uuidv4(), user_id: ad.user_id,
      type: 'ad_published', title: '🎉 Ad Published!',
      message: `Your ad is now live and visible to buyers! It will expire on ${expiresAt.toLocaleDateString()}.`,
      is_read: false, ad_id: id,
    });

    res.json({ message: 'Ad published successfully' });
  } catch (err) { next(err); }
}

export async function featureAd(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { is_featured } = req.body;

    await supabase.from('ads').update({
      is_featured,
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    // Recalculate ranking score
    const { data: ad } = await supabase.from('ads').select('package_type, published_at, admin_boost').eq('id', id).single();
    if (ad) {
      const pkg = PACKAGES[ad.package_type as keyof typeof PACKAGES];
      const score = calculateRankingScore({
        packageWeight: pkg.weight,
        isFeatured: is_featured,
        adminBoost: ad.admin_boost || 0,
        isVerifiedSeller: false,
        publishedAt: new Date(ad.published_at || Date.now()),
      });
      await supabase.from('ads').update({ ranking_score: score }).eq('id', id);
    }

    res.json({ message: is_featured ? 'Ad featured' : 'Ad unfeatured' });
  } catch (err) { next(err); }
}

export async function listUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);

    let query = supabase
      .from('users')
      .select('id, email, full_name, role, is_verified, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((pageNum - 1) * limitNum, pageNum * limitNum - 1);

    if (role) query = query.eq('role', role as string);

    const { data, error, count } = await query;
    if (error) throw new AppError(error.message, 500);

    res.json({ users: data || [], total: count || 0, page: pageNum });
  } catch (err) { next(err); }
}

export async function updateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { role, is_verified } = req.body;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (role) updates.role = role;
    if (typeof is_verified === 'boolean') updates.is_verified = is_verified;

    const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
    if (error) throw new AppError(error.message, 500);

    res.json({ user: data });
  } catch (err) { next(err); }
}

export async function getCategories(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) throw new AppError(error.message, 500);
    res.json({ categories: data || [] });
  } catch (err) { next(err); }
}

export async function createCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, slug, icon } = req.body;
    const { data, error } = await supabase
      .from('categories')
      .insert({ id: uuidv4(), name, slug, icon })
      .select().single();
    if (error) throw new AppError(error.message, 500);
    res.status(201).json({ category: data });
  } catch (err) { next(err); }
}