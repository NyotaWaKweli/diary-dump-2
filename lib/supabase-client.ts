import { createBrowserClient } from '@supabase/ssr';

// Browser-safe client using ANON key
// This client is for auth session management ONLY
// ALL write operations MUST go through API routes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
