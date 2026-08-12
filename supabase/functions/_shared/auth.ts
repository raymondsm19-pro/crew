import { adminClient } from "./supabase-admin.ts";
import { HttpError } from "./http-error.ts";

export type WorkerRow = {
  id: string;
  name: string;
  phone: string;
  role: string;
  active: boolean;
  password_hash: string;
};

/**
 * Replaces the source app's cookie-based useSession/currentWorker/requireWorker
 * (crew.server.ts lines 66-126) — React Native has no shared cookie jar, so
 * auth is an opaque bearer token looked up in crew_sessions instead.
 */
export async function requireWorker(req: Request): Promise<WorkerRow> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) throw new HttpError(401, "Sign in again to continue.");

  const db = adminClient();
  const { data: session } = await db
    .from("crew_sessions")
    .select("worker_id, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (!session || new Date(session.expires_at as string) < new Date()) {
    throw new HttpError(401, "Sign in again to continue.");
  }

  const { data: worker } = await db
    .from("crew_workers")
    .select("id, name, phone, role, active, password_hash")
    .eq("id", session.worker_id as string)
    .maybeSingle();
  const row = worker as unknown as WorkerRow | null;
  if (!row || !row.active) throw new HttpError(401, "Sign in again to continue.");

  // Best-effort, matches the source's "never block a punch" philosophy.
  void db.from("crew_sessions").update({ last_seen_at: new Date().toISOString() }).eq("token", token);

  return row;
}

/** Ported verbatim from crew.server.ts lines 637-641 (Deno.env instead of process.env). */
export function requireAdminPin(pin: string) {
  const expected = Deno.env.get("CREW_ADMIN_PIN");
  if (!expected) throw new HttpError(500, "No crew admin code is set for this project yet.");
  if (pin.trim() !== expected) throw new HttpError(401, "That admin code isn't right.");
}
