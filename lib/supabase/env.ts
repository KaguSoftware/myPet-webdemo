/**
 * True only when both public Supabase keys are configured. The `NEXT_PUBLIC_`
 * vars are inlined into the client bundle at build time and read at runtime on
 * the server, so this constant is usable in both places to gate the app behind
 * a friendly config screen instead of crashing when the keys are missing.
 */
export const supabaseEnvReady = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
