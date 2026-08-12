import { serveJson } from "../_shared/handler.ts";
import { adminClient } from "../_shared/supabase-admin.ts";
import { requireWorker } from "../_shared/auth.ts";
import { crewStatusFor } from "../_shared/crew-status.ts";
import { minutesBetween } from "../_shared/dates.ts";
import { HttpError } from "../_shared/http-error.ts";

serveJson(async (req) => {
  const worker = await requireWorker(req);
  const db = adminClient();

  const { data: open } = await db
    .from("crew_breaks")
    .select("id, shift_id, started_at")
    .eq("worker_id", worker.id)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1);
  const row = (open ?? [])[0] as { id: string; shift_id: string; started_at: string } | undefined;
  if (!row) throw new HttpError(409, "You're not on a break.");

  const endedAt = new Date().toISOString();
  const minutes = minutesBetween(row.started_at, endedAt);
  await db.from("crew_breaks").update({ ended_at: endedAt, minutes }).eq("id", row.id);

  const { data: shiftData } = await db
    .from("crew_shifts")
    .select("break_minutes")
    .eq("id", row.shift_id)
    .maybeSingle();
  const current = ((shiftData as { break_minutes: number } | null)?.break_minutes ?? 0) + minutes;
  await db.from("crew_shifts").update({ break_minutes: current }).eq("id", row.shift_id);

  return crewStatusFor(worker);
});
