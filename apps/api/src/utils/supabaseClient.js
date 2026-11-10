import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "./loadEnv.js";

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_KEY = SUPABASE_SECRET_KEY || SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
	throw new Error("Missing SUPABASE_URL and SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY) in apps/api/.env");
}

if (SUPABASE_KEY.startsWith("sb_publishable_") || SUPABASE_KEY.startsWith("sb_anon_")) {
	throw new Error("Invalid Supabase key for API server. Use SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY, not publishable/anon keys.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
	auth: {
		persistSession: false,
		autoRefreshToken: false,
	},
});

export default supabase;



