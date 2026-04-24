import { supabase } from '@/db/connect';
import { AppError } from '../middlewares/error.middleware';
import { AD_STATUS } from '@shared/constants/adStatus';
import { PACKAGES, calculateRankingScore } from '@shared/constants/packageTypes';

export async function recalculateAdRanking(adId: string) {
  const { data: ad } = await supabase
    .from('ads')
    .select('package_type, is_featured, admin_boost, published_at')
    .eq('id', adId)
    .single();

  if (!ad) return;

  const pkg = PACKAGES[ad.package_type as keyof typeof PACKAGES];
  if (!pkg) return;

  const score = calculateRankingScore({
    packageWeight: pkg.weight,
    isFeatured: ad.is_featured,
    adminBoost: ad.admin_boost || 0,
    isVerifiedSeller: false,
    publishedAt: new Date(ad.published_at || Date.now()),
  });

  await supabase.from('ads').update({ ranking_score: score }).eq('id', adId);
}

export async function getExpiredAds() {
  const { data } = await supabase
    .from('ads')
    .select('id, user_id, title, expires_at')
    .eq('status', AD_STATUS.PUBLISHED)
    .lt('expires_at', new Date().toISOString());

  return data || [];
}

export async function getScheduledAdsToPublish() {
  const { data } = await supabase
    .from('ads')
    .select('id, user_id, title, package_type, scheduled_at')
    .eq('status', AD_STATUS.SCHEDULED)
    .lte('scheduled_at', new Date().toISOString());

  return data || [];
}

export async function getAdsExpiringWithin48Hours() {
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const { data } = await supabase
    .from('ads')
    .select('id, user_id, title, expires_at')
    .eq('status', AD_STATUS.PUBLISHED)
    .gte('expires_at', now.toISOString())
    .lte('expires_at', in48h.toISOString());

  return data || [];
}

export async function bulkRecalculateRankings() {
  const { data: ads } = await supabase
    .from('ads')
    .select('id, package_type, is_featured, admin_boost, published_at')
    .eq('status', AD_STATUS.PUBLISHED);

  if (!ads) return;

  for (const ad of ads) {
    const pkg = PACKAGES[ad.package_type as keyof typeof PACKAGES];
    if (!pkg) continue;

    const score = calculateRankingScore({
      packageWeight: pkg.weight,
      isFeatured: ad.is_featured,
      adminBoost: ad.admin_boost || 0,
      isVerifiedSeller: false,
      publishedAt: new Date(ad.published_at || Date.now()),
    });

    await supabase.from('ads').update({ ranking_score: score }).eq('id', ad.id);
  }

  console.log(`[Rankings] Recalculated ${ads.length} ads`);
}