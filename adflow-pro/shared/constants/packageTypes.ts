export const PACKAGE_TYPES = {
  BASIC: 'basic',
  STANDARD: 'standard',
  PREMIUM: 'premium',
} as const;

export type PackageType = (typeof PACKAGE_TYPES)[keyof typeof PACKAGE_TYPES];

export interface PackageConfig {
  id: PackageType;
  name: string;
  durationDays: number;
  weight: number;
  price: number;
  features: string[];
  homepageVisible: boolean;
  autoRefresh: boolean;
  categoryPriority: boolean;
}

export const PACKAGES: Record<PackageType, PackageConfig> = {
  basic: {
    id: 'basic',
    name: 'Basic',
    durationDays: 7,
    weight: 1,
    price: 999, // stored in cents
    features: ['7 days listing', 'Standard visibility', 'Basic support'],
    homepageVisible: false,
    autoRefresh: false,
    categoryPriority: false,
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    durationDays: 15,
    weight: 2,
    price: 2499,
    features: ['15 days listing', 'Category priority', 'Email support', 'Stats dashboard'],
    homepageVisible: false,
    autoRefresh: false,
    categoryPriority: true,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    durationDays: 30,
    weight: 3,
    price: 4999,
    features: [
      '30 days listing',
      'Homepage visibility',
      'Auto-refresh every 7 days',
      'Priority support',
      'Featured badge',
      'Advanced analytics',
    ],
    homepageVisible: true,
    autoRefresh: true,
    categoryPriority: true,
  },
};

/**
 * Ranking score formula:
 * score = (packageWeight * 10) + (featuredBoost * 15) + (adminBoost * 20)
 *       + (verifiedSeller * 5) + freshnessScore(publishedAt)
 */
export const calculateRankingScore = (params: {
  packageWeight: number;
  isFeatured: boolean;
  adminBoost: number;
  isVerifiedSeller: boolean;
  publishedAt: Date;
}): number => {
  const { packageWeight, isFeatured, adminBoost, isVerifiedSeller, publishedAt } = params;
  const ageHours = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
  const freshnessScore = Math.max(0, 100 - ageHours * 0.5);
  return (
    packageWeight * 10 +
    (isFeatured ? 15 : 0) +
    adminBoost * 20 +
    (isVerifiedSeller ? 5 : 0) +
    freshnessScore
  );
};