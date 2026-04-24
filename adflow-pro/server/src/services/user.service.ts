import { supabase } from '@/db/connect';
import { AppError } from '../middlewares/error.middleware';

export async function getUserById(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, is_verified, created_at')
    .eq('id', userId)
    .single();

  if (error || !data) throw new AppError('User not found', 404);
  return data;
}

export async function getSellerProfile(userId: string) {
  const { data } = await supabase
    .from('seller_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data;
}

export async function updateSellerProfile(
  userId: string,
  updates: {
    business_name?: string;
    phone?: string;
    city?: string;
    bio?: string;
  }
) {
  const { data, error } = await supabase
    .from('seller_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new AppError('Failed to update profile: ' + error.message, 500);
  return data;
}

export async function incrementAdCount(userId: string) {
  const { data: profile } = await supabase
    .from('seller_profiles')
    .select('total_ads')
    .eq('user_id', userId)
    .single();

  if (profile) {
    await supabase
      .from('seller_profiles')
      .update({ total_ads: (profile.total_ads || 0) + 1 })
      .eq('user_id', userId);
  }
}