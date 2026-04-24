import { supabase } from '@/db/connect';
import { PACKAGES, PackageType } from '@shared/constants/packageTypes';
import { AppError } from '../middlewares/error.middleware';

export async function getPackages() {
  // Return from constants (source of truth)
  return Object.values(PACKAGES);
}

export async function validatePackageForAd(packageType: PackageType, adId: string) {
  const pkg = PACKAGES[packageType];
  if (!pkg) throw new AppError('Invalid package type', 400);

  // Check if ad already has a verified payment
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id, status')
    .eq('ad_id', adId)
    .eq('status', 'verified')
    .single();

  if (existingPayment) {
    throw new AppError('Ad already has a verified payment', 400);
  }

  return pkg;
}

export async function getPackageUpgradeOptions(currentPackage: PackageType) {
  const order: PackageType[] = ['basic', 'standard', 'premium'];
  const currentIdx = order.indexOf(currentPackage);
  return order.slice(currentIdx + 1).map((p) => PACKAGES[p]);
}