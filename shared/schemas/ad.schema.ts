import { z } from 'zod';

export const createAdSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(120),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  price: z.number().positive().optional(),
  price_negotiable: z.boolean().default(false),
  category_id: z.string().uuid('Invalid category'),
  city_id: z.string().uuid('Invalid city'),
  package_type: z.enum(['basic', 'standard', 'premium']),
  media_urls: z.array(z.string().url()).max(10).optional(),
});

export const updateAdSchema = createAdSchema.partial();

export const adFiltersSchema = z.object({
  search: z.string().optional(),
  category_id: z.string().uuid().optional(),
  city_id: z.string().uuid().optional(),
  package_type: z.enum(['basic', 'standard', 'premium']).optional(),
  min_price: z.coerce.number().positive().optional(),
  max_price: z.coerce.number().positive().optional(),
  sort: z.enum(['ranking', 'newest', 'price_asc', 'price_desc']).default('ranking'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const moderateAdSchema = z.object({
  action: z.enum(['approve', 'reject']),
  notes: z.string().max(500).optional(),
  rejection_reason: z.string().max(500).optional(),
});

export type CreateAdInput = z.infer<typeof createAdSchema>;
export type UpdateAdInput = z.infer<typeof updateAdSchema>;
export type AdFiltersInput = z.infer<typeof adFiltersSchema>;
export type ModerateAdInput = z.infer<typeof moderateAdSchema>;