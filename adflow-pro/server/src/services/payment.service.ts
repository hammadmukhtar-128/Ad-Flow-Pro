import { supabase } from '@/db/connect';
import { AppError } from '../middlewares/error.middleware';

export async function getPaymentsByAdId(adId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('ad_id', adId)
    .order('created_at', { ascending: false });

  if (error) throw new AppError(error.message, 500);
  return data || [];
}

export async function getPaymentStats() {
  const { data } = await supabase
    .from('payments')
    .select('amount, status, package_type, created_at');

  const payments = data || [];
  const now = new Date();
  const thisMonth = payments.filter((p: any) => {
    const d = new Date(p.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  return {
    total_revenue: payments
      .filter((p: any) => p.status === 'verified')
      .reduce((s: any, p: any) => s + p.amount, 0),
    monthly_revenue: thisMonth
      .filter((p: any) => p.status === 'verified')
      .reduce((s: any, p: any) => s + p.amount, 0),
    pending_count: payments.filter((p: any) => p.status === 'submitted').length,
    verified_count: payments.filter((p: any) => p.status === 'verified').length,
    by_package: {
      basic: payments.filter((p: any) => p.package_type === 'basic' && p.status === 'verified').length,
      standard: payments.filter((p: any) => p.package_type === 'standard' && p.status === 'verified').length,
      premium: payments.filter((p: any) => p.package_type === 'premium' && p.status === 'verified').length,
    },
  };
}