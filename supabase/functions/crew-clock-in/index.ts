import { serveJson, readJson } from "../_shared/handler.ts";
import { adminClient } from "../_shared/supabase-admin.ts";
import { requireWorker } from "../_shared/auth.ts";
import { crewStatusFor, projectOrThrow } from "../_shared/crew-status.ts";
import { workDate } from "../_shared/dates.ts";
import { text, coords } from "../_shared/validation.ts";
import { SAFETY_ITEMS } from "../_shared/constants.ts";
import { HttpError } from "../_shared/http-error.ts";

type Body = {
  projectId?: string;
  safety?: Record<string, boolean>;
  safetyNote?: string;
  lat?: number;
  lng?: number;
  accuracy?: number;
};

serveJson(async (req) => {
  const worker = await requireWorker(req);
  const body = await readJson<Body>(req);

  const projectId = text(body?.projectId);
  if (!projectId) throw new HttpError(400, "Pick your project first.");
  const safety: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(body?.safety ?? {})) safety[text(k, 40)] = Boolean(v);
  const safetyNote = text(body?.safetyNote, 500);
  const c = coords(body);

  const project = await projectOrThrow(projectId);
  const db = adminClient();

  const { data: existing } = await db
    .from("crew_shifts")
    .select("id")
    .eq("worker_id", worker.id)
    .is("clock_out_at", null)
    .limit(1);
  if ((existing ?? []).length) throw new HttpError(409, "You're already clocked in. Clock out first.");

  const today = workDate();
  const { data: inserted, error } = await db
    .from("crew_shifts")
    .insert({
      worker_id: worker.id,
      project_id: project.id,
      project_name: project.label,
      work_date: today,
      clock_in_at: new Date().toISOString(),
      clock_in_lat: c.lat ?? null,
      clock_in_lng: c.lng ?? null,
      clock_in_accuracy: c.accuracy ?? null,
    })
    .select("id")
    .single();
  if (error) throw new HttpError(500, `Couldn't clock you in: ${error.message}`);
  const shiftId = (inserted as { id: string }).id;

  const answers = Object.fromEntries(SAFETY_ITEMS.map((i) => [i.key, Boolean(safety[i.key])]));
  const flagged = Object.values(answers).some((v) => !v);
  await db.from("crew_safety_checks").insert({
    worker_id: worker.id,
    shift_id: shiftId,
    project_id: project.id,
    project_name: project.label,
    work_date: today,
    answers,
    note: safetyNote.slice(0, 500),
    flagged,
  });

  // Note: the source app also lit a wall-board "crew on site" marker here
  // (writeCrewOnSite) and mirrored the safety check to Google Sheets
  // (syncSafety) — both dropped, this standalone app has neither dependency.

  return crewStatusFor(worker);
});
