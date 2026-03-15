import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const hasSupabaseAdminEnv = Boolean(url && serviceKey);

if (!hasSupabaseAdminEnv && process.env.NODE_ENV === "production") {
  throw new Error(
    "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
}

if (!hasSupabaseAdminEnv) {
  console.warn(
    "Supabase admin env vars are missing. Using fallback admin client for development. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local"
  );
}

export const supabaseAdmin = createClient(
  url || "https://placeholder.supabase.co",
  serviceKey || "placeholder-service-role-key",
  {
  auth: { persistSession: false },
  }
);