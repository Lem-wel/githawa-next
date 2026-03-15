import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasSupabaseEnv && process.env.NODE_ENV === "production") {
	throw new Error(
		"Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
	);
}

if (!hasSupabaseEnv) {
	console.warn(
		"Supabase env vars are missing. Using fallback client for development. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
	);
}

export const supabase = createClient(
	supabaseUrl || "https://placeholder.supabase.co",
	supabaseAnonKey || "placeholder-anon-key"
);