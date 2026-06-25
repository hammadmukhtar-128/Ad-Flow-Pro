const { createClient } = require("@supabase/supabase-js");

// ─── Startup Validation ────────────────────────────────────────────────────
// These must match the Railway environment variable names exactly.
if (!process.env.SUPABASE_URL) {
  throw new Error(
    "SUPABASE_URL missing — add it as a Railway environment variable."
  );
}

if (!process.env.SUPABASE_KEY) {
  throw new Error(
    "SUPABASE_KEY missing — add the service role (secret) key as a Railway environment variable."
  );
}
// ──────────────────────────────────────────────────────────────────────────

// Server-side client: uses the service role key (SUPABASE_KEY) to bypass RLS.
// Never expose this key to the client/browser.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

module.exports = { supabase };