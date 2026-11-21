import { createBrowserClient } from '@supabase/ssr';

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_1JeJsZsaGfliFcmiDH0HJA_utAKh7mX';

  return createBrowserClient(supabaseUrl, supabaseKey);
};
