import { serveJson, readJson } from "../_shared/handler.ts";
import { adminClient } from "../_shared/supabase-admin.ts";
import { passwordMatches, normalizePhone } from "../_shared/password.ts";
import { crewStatusFor } from "../_shared/crew-status.ts";
import { text } from "../_shared/validation.ts";
import { HttpError } from "../_shared/http-error.ts";
import type { WorkerRow } from "../_shared/auth.ts";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

serveJson(async (req) => {
  const body = await readJson<{ phone?: string; password?: string }>(req);
  const phone = text(body?.phone, 25);
  const password = String(body?.password ?? "");
  if (!phone) throw new HttpError(400, "Enter your phone number.");
  if (!password) throw new HttpError(400, "Enter your password.");

  const db = adminClient();
  const { data } = await db
    .from("crew_workers")
    .select("id, name, phone, role, active, password_hash")
    .eq("phone", normalizePhone(phone))
    .maybeSingle();
  const row = data as unknown as WorkerRow | null;
  const ok = row && row.active && (await passwordMatches(password, row.password_hash));
  if (!row || !ok) throw new HttpError(401, "That phone number and password don't match.");

  const expiresAt = new Date(Date.now() + THIRTY_DAYS_MS).toISOString();
  const { data: session, error } = await db
    .from("crew_sessions")
    .insert({ worker_id: row.id, expires_at: expiresAt })
    .select("token")
    .single();
  if (error) throw new HttpError(500, `Couldn't sign you in: ${error.message}`);

  const status = await crewStatusFor(row);
  return { token: (session as { token: string }).token, expiresAt, status };
});
