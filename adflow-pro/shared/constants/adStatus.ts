export const AD_STATUS = {
  DRAFT: 'draft',
  UNDER_REVIEW: 'under_review',
  PAYMENT_PENDING: 'payment_pending',
  PAYMENT_VERIFIED: 'payment_verified',
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
  EXPIRED: 'expired',
  REJECTED: 'rejected',
} as const;

export type AdStatus = (typeof AD_STATUS)[keyof typeof AD_STATUS];

export const AD_STATUS_LABELS: Record<AdStatus, string> = {
  draft: 'Draft',
  under_review: 'Under Review',
  payment_pending: 'Payment Pending',
  payment_verified: 'Payment Verified',
  scheduled: 'Scheduled',
  published: 'Published',
  expired: 'Expired',
  rejected: 'Rejected',
};

export const AD_STATUS_COLORS: Record<AdStatus, string> = {
  draft: 'gray',
  under_review: 'yellow',
  payment_pending: 'orange',
  payment_verified: 'blue',
  scheduled: 'purple',
  published: 'green',
  expired: 'red',
  rejected: 'red',
};

/** Valid transitions: from → allowed next statuses */
export const AD_STATUS_TRANSITIONS: Record<AdStatus, AdStatus[]> = {
  draft: ['under_review'],
  under_review: ['payment_pending', 'rejected'],
  payment_pending: ['payment_verified', 'rejected'],
  payment_verified: ['scheduled', 'published'],
  scheduled: ['published', 'expired'],
  published: ['expired'],
  expired: [],
  rejected: ['draft'],
};