import { Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/db/connect';
import { AppError } from '../middlewares/error.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';
import { PACKAGES } from '@shared/constants/packageTypes';
import { AD_STATUS } from '@shared/constants/adStatus';

export async function createPayment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { ad_id, package_type, payment_method, transaction_reference, screenshot_url } = req.body;

    // Validate ad ownership and status
    const { data: ad } = await supabase.from('ads').select('user_id, status').eq('id', ad_id).single();
    if (!ad) throw new AppError('Ad not found', 404);
    if (ad.user_id !== req.user!.id) throw new AppError('Forbidden', 403);
    if (ad.status !== AD_STATUS.PAYMENT_PENDING) {
      throw new AppError('Ad is not in payment pending status', 400);
    }

    const pkg = PACKAGES[package_type as keyof typeof PACKAGES];
    if (!pkg) throw new AppError('Invalid package type', 400);

    const paymentId = uuidv4();
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        id: paymentId,
        ad_id,
        user_id: req.user!.id,
        amount: pkg.price,
        currency: 'PKR',
        package_type,
        status: 'submitted',
        payment_method,
        transaction_reference,
        screenshot_url,
      })
      .select()
      .single();

    if (error) throw new AppError('Failed to create payment: ' + error.message, 500);

    // Create notification for admin
    await supabase.from('notifications').insert({
      id: uuidv4(),
      user_id: req.user!.id,
      type: 'system',
      title: 'Payment Submitted',
      message: `Payment for ad submitted. Awaiting admin verification.`,
      is_read: false,
      ad_id,
    });

    res.status(201).json({ payment });
  } catch (err) { next(err); }
}

export async function listPayments(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status } = req.query;
    const isAdmin = ['admin', 'super_admin'].includes(req.user!.role);

    let query = supabase.from('payments').select('*').order('created_at', { ascending: false });

    if (!isAdmin) {
      query = query.eq('user_id', req.user!.id);
    }

    if (status) query = query.eq('status', status as string);

    const { data, error } = await query;
    if (error) throw new AppError(error.message, 500);

    res.json({ payments: data || [] });
  } catch (err) { next(err); }
}

export async function verifyPayment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { action, rejection_reason } = req.body;

    const { data: payment } = await supabase.from('payments').select('*').eq('id', id).single();
    if (!payment) throw new AppError('Payment not found', 404);
    if (payment.status !== 'submitted') throw new AppError('Payment already processed', 400);

    if (action === 'verify') {
      // Update payment
      await supabase.from('payments').update({
        status: 'verified',
        verified_by: req.user!.id,
        verified_at: new Date().toISOString(),
      }).eq('id', id);

      // Update ad status to payment_verified
      await supabase.from('ads').update({
        status: AD_STATUS.PAYMENT_VERIFIED,
        updated_at: new Date().toISOString(),
      }).eq('id', payment.ad_id);

      // Status history
      await supabase.from('ad_status_history').insert({
        id: uuidv4(), ad_id: payment.ad_id,
        from_status: AD_STATUS.PAYMENT_PENDING,
        to_status: AD_STATUS.PAYMENT_VERIFIED,
        changed_by: req.user!.id,
        note: 'Payment verified by admin',
      });

      // Notify client
      await supabase.from('notifications').insert({
        id: uuidv4(), user_id: payment.user_id,
        type: 'payment_verified', title: 'Payment Verified!',
        message: 'Your payment has been verified. Your ad will be published shortly.',
        is_read: false, ad_id: payment.ad_id,
      });

    } else {
      await supabase.from('payments').update({
        status: 'rejected',
        rejection_reason,
      }).eq('id', id);

      await supabase.from('notifications').insert({
        id: uuidv4(), user_id: payment.user_id,
        type: 'system', title: 'Payment Rejected',
        message: `Payment rejected: ${rejection_reason || 'Please resubmit payment.'}`,
        is_read: false, ad_id: payment.ad_id,
      });
    }

    res.json({ message: action === 'verify' ? 'Payment verified' : 'Payment rejected' });
  } catch (err) { next(err); }
}