import { createClient } from './supabase/server';
import { UserRole } from './types';

export const getCurrentUser = async () => {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch (err) {
    return null;
  }
};

export const getUserRole = async (userId: string): Promise<UserRole> => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error || !data) return 'customer';
    return data.role as UserRole;
  } catch (err) {
    return 'customer';
  }
};

export const isAdmin = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) return false;
  const role = await getUserRole(user.id);
  return role === 'admin';
};
