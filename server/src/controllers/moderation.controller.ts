import { Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/db/connect';
import { AppError } from '../middlewares/error.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AD_STATUS } from '@shared/constants/adStatus';

const AD_SELECT = `
  id, title, description, price, price_negotiable, status, package_type,
  slug, views, created_at, updated_at, user_id,
  category:categories(id, name),
  city:cities(id, name),
  media:ad_media(id, source_type, original_url, normalized_thumbnail_url, validation_status, sort_order)
`;

export async function getModerationQueue(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);

    const { data, error, count } = await supabase
      .from('ads')
      .select(AD_SELECT, { count: 'exact' })
      .eq('status', AD_STATUS.UNDER_REVIEW)
      .order('created_at', { ascending: true })
      .range((pageNum - 1) * limitNum, pageNum * limitNum - 1);

    if (error) throw new AppError(error.message, 500);
    res.json({ ads: data || [], total: count || 0, page: pageNum });
  } catch (err) { next(err); }
}

export async function approveAd(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const { data: ad } = await supabase.from('ads').select('user_id, status, title').eq('id', id).single();
    if (!ad) throw new AppError('Ad not found', 404);
    if (ad.status !== AD_STATUS.UNDER_REVIEW) {
      throw new AppError('Ad is not under review', 400);
    }

    await supabase.from('ads').update({
      status: AD_STATUS.PAYMENT_PENDING,
      moderator_notes: notes,
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    await supabase.from('ad_status_history').insert({
      id: uuidv4(), ad_id: id,
      from_status: AD_STATUS.UNDER_REVIEW,
      to_status: AD_STATUS.PAYMENT_PENDING,
      changed_by: req.user!.id, note: notes,
    });

    await supabase.from('audit_logs').insert({
      id: uuidv4(), user_id: req.user!.id,
      action: 'ad_approved', resource_type: 'ad', resource_id: id,
      details: { notes },
    });

    // Notify client
    await supabase.from('notifications').insert({
      id: uuidv4(), user_id: ad.user_id,
      type: 'ad_approved', title: 'Ad Approved!',
      message: `Your ad "${ad.title}" has been approved. Please complete your payment to publish.`,
      is_read: false, ad_id: id,
    });

    res.json({ message: 'Ad approved — moved to payment pending' });
  } catch (err) { next(err); }
}

export async function rejectAd(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { rejection_reason, notes } = req.body;

    if (!rejection_reason?.trim()) {
      throw new AppError('Rejection reason is required', 400);
    }

    const { data: ad } = await supabase.from('ads').select('user_id, status, title').eq('id', id).single();
    if (!ad) throw new AppError('Ad not found', 404);

    await supabase.from('ads').update({
      status: AD_STATUS.REJECTED,
      rejection_reason,
      moderator_notes: notes,
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    await supabase.from('ad_status_history').insert({
      id: uuidv4(), ad_id: id,
      from_status: ad.status, to_status: AD_STATUS.REJECTED,
      changed_by: req.user!.id, note: rejection_reason,
    });

    await supabase.from('audit_logs').insert({
      id: uuidv4(), user_id: req.user!.id,
      action: 'ad_rejected', resource_type: 'ad', resource_id: id,
      details: { rejection_reason, notes },
    });

    await supabase.from('notifications').insert({
      id: uuidv4(), user_id: ad.user_id,
      type: 'ad_rejected', title: 'Ad Rejected',
      message: `Your ad "${ad.title}" was rejected: ${rejection_reason}`,
      is_read: false, ad_id: id,
    });

    res.json({ message: 'Ad rejected' });
  } catch (err) { next(err); }
}