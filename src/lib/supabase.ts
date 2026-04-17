import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let anonClient: SupabaseClient | undefined;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  anonClient ??= createClient(supabaseUrl, supabaseAnonKey);
  return anonClient;
}

let serviceClient: SupabaseClient | undefined;

export function getServiceSupabase(): SupabaseClient | null {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  serviceClient ??= createClient(supabaseUrl, serviceRoleKey);
  return serviceClient;
}
