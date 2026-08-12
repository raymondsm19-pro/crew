/**
 * Shared status-assembly logic used by crew-signin, crew-status, crew-clock-in,
 * crew-start-break, crew-end-break and crew-clock-out — each of those ends by
 * returning the worker's fresh CrewStatus, mirroring crew.server.ts's pattern
 * of every mutator ending with `return (await crewStatus())!`.
 */
import { adminClient } from "./supabase-admin.ts";
import { workDate, minutesBetween } from "./dates.ts";
import { HttpError } from "./http-error.ts";
import type { WorkerRow } from "./auth.ts";

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

type BreakRow = { id: string; shift_id: string; started_at: string; ended_at: string | null; minutes: number | null };

const SHIFT_COLS = "id, project_id, project_name, work_date, clock_in_at, clock_out_at, break_minutes, worked_minutes";

export const toWorker = (r: WorkerRow) => ({ id: r.id, name: r.name, phone: r.phone, role: r.role ?? "" });

function toShift(row: ShiftRow, breaks: BreakRow[]) {
  return {
    id: row.id,
    projectId: row.project_id,
    projectName: row.project_name ?? "",
    workDate: row.work_date,
    clockInAt: row.clock_in_at,
    clockOutAt: row.clock_out_at,
    breakMinutes: row.break_minutes ?? 0,
    workedMinutes: row.worked_minutes,
    breaks: breaks
      .filter((b) => b.shift_id === row.id)
      .map((b) => ({ id: b.id, startedAt: b.started_at, endedAt: b.ended_at, minutes: b.minutes })),
  };
}

/** Replaces the source's boardConfig("field").projects read with a `projects` table query. */
export async function fieldProjects(): Promise<{ id: string; label: string }[]> {
  const db = adminClient();
  const { data } = await db.from("projects").select("id, name").eq("active", true).order("name");
  return ((data ?? []) as unknown as { id: string; name: string }[]).map((p) => ({ id: p.id, label: p.name }));
}

/** Replaces the source's boardConfig("field").projects.find(...) lookup. */
export async function projectOrThrow(projectId: string): Promise<{ id: string; label: string }> {
  const db = adminClient();
  const { data } = await db
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .eq("active", true)
    .maybeSingle();
  const row = data as unknown as { id: string; name: string } | null;
  if (!row) throw new HttpError(400, "Pick a project from the list.");
  return { id: row.id, label: row.name };
}

export async function crewStatusFor(worker: WorkerRow) {
  const db = adminClient();
  const today = workDate();

  const [{ data: shiftRows }, { data: safetyRows }] = await Promise.all([
    db
      .from("crew_shifts")
      .select(SHIFT_COLS)
      .eq("worker_id", worker.id)
      .or(`work_date.eq.${today},clock_out_at.is.null`)
      .order("clock_in_at", { ascending: true }),
    db.from("crew_safety_checks").select("id").eq("worker_id", worker.id).eq("work_date", today).limit(1),
  ]);

  const shifts = (shiftRows ?? []) as unknown as ShiftRow[];
  const ids = shifts.map((s) => s.id);
  let breaks: BreakRow[] = [];
  if (ids.length) {
    const { data } = await db
      .from("crew_breaks")
      .select("id, shift_id, started_at, ended_at, minutes")
      .in("shift_id", ids)
      .order("started_at", { ascending: true });
    breaks = (data ?? []) as unknown as BreakRow[];
  }

  const mapped = shifts.map((s) => toShift(s, breaks));
  const openShift = mapped.find((s) => !s.clockOutAt) ?? null;
  const openBreak = openShift?.breaks.find((b) => !b.endedAt) ?? null;
  const todayShifts = mapped.filter((s) => s.workDate === today);
  const todayMinutes = todayShifts.reduce((sum, s) => {
    if (s.workedMinutes != null) return sum + s.workedMinutes;
    const raw = minutesBetween(s.clockInAt, new Date().toISOString());
    const live = openBreak ? minutesBetween(openBreak.startedAt, new Date().toISOString()) : 0;
    return sum + Math.max(0, raw - s.breakMinutes - live);
  }, 0);

  return {
    worker: toWorker(worker),
    projects: await fieldProjects(),
    openShift,
    openBreak,
    todayShifts,
    todayMinutes,
    safetyDone: (safetyRows ?? []).length > 0,
  };
}
