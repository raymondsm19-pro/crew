import { serveJson, readJson } from "../_shared/handler.ts";
import { adminClient } from "../_shared/supabase-admin.ts";
import { requireWorker } from "../_shared/auth.ts";
import { crewStatusFor } from "../_shared/crew-status.ts";
import { minutesBetween } from "../_shared/dates.ts";
import { text, coords } from "../_shared/validation.ts";
import { HttpError } from "../_shared/http-error.ts";

type ShiftRow = {
  id: string;
  project_id: string;
  project_name: string;
  work_date: string;
  clock_in_at: string;
  clock_out_at: string | null;
  break_minutes: number;
  worked_minutes: number | null;
};

type Body = { note?: string; lat?: number; lng?: number; accuracy?: number };

serveJson(async (req) => {
  const worker = await requireWorker(req);
  const body = await readJson<Body>(req);
  const note = text(body?.note, 500);
  const c = coords(body);

  const db = adminClient();
  const { data: shifts } = await db
    .from("crew_shifts")
    .select("id, project_id, project_name, work_date, clock_in_at, clock_out_at, break_minutes, worked_minutes")
    .eq("worker_id", worker.id)
    .is("clock_out_at", null)
    .order("clock_in_at", { ascending: false })
    .limit(1);
  const shift = (shifts ?? [])[0] as ShiftRow | undefined;
  if (!shift) throw new HttpError(409, "You're not clocked in.");

  // An open break ends with the shift, so the hours aren't overstated.
  const { data: openBreaks } = await db
    .from("crew_breaks")
    .select("id, started_at")
    .eq("shift_id", shift.id)
    .is("ended_at", null);
  const nowIso = new Date().toISOString();
  let breakMinutes = shift.break_minutes ?? 0;
  for (const b of (openBreaks ?? []) as { id: string; started_at: string }[]) {
    const mins = minutesBetween(b.started_at, nowIso);
    breakMinutes += mins;
    await db.from("crew_breaks").update({ ended_at: nowIso, minutes: mins }).eq("id", b.id);
  }

  const worked = Math.max(0, minutesBetween(shift.clock_in_at, nowIso) - breakMinutes);
  const { error } = await db
    .from("crew_shifts")
    .update({
      clock_out_at: nowIso,
      clock_out_lat: c.lat ?? null,
      clock_out_lng: c.lng ?? null,
      clock_out_accuracy: c.accuracy ?? null,
      break_minutes: breakMinutes,
      worked_minutes: worked,
      note: note.slice(0, 500),
    })
    .eq("id", shift.id);
  if (error) throw new HttpError(500, `Couldn't clock you out: ${error.message}`);

  // Note: the source app also cleared a wall-board "crew on site" marker here
  // and mirrored the punch to Google Sheets (syncTimesheet) — both dropped.

  return crewStatusFor(worker);
});
