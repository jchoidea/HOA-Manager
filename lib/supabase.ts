import { createClient } from "@supabase/supabase-js";

// Server-side client using the service role key — full read/write access.
// NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser. It's only read
// here, in server-only files (API routes / server components).
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
