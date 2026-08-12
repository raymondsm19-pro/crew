import { serveJson } from "../_shared/handler.ts";
import { adminClient } from "../_shared/supabase-admin.ts";

serveJson(async (req) => {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (token) {
    // Delete (not just discard client-side) so a leaked token can't be replayed.
    await adminClient().from("crew_sessions").delete().eq("token", token);
  }
  return { ok: true };
});
