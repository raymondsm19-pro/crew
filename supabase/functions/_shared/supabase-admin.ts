import { createClient } from "npm:@supabase/supabase-js@2";
import type { Database } from "./db-types.ts";

let _client: ReturnType<typeof createClient<Database>> | undefined;

/**
 * Service-role client. SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected
 * automatically into every Edge Function's environment by the Supabase
 * platform — never set manually, never shipped to a client app.
 */
export function adminClient() {
  if (_client) return _client;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set.");
  _client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}
