import { createClient } from '@supabase/supabase-js';

// Admin / Service Role Client (for Server-side Route Handlers, Webhooks & Inventory Deduction)
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'sb_publishable_1JeJsZsaGfliFcmiDH0HJA_utAKh7mX';

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
