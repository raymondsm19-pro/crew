import { adminClient } from "./supabase-admin.ts";
import { requireAdminPin } from "./auth.ts";
import { workDate, clockTime, minutesBetween } from "./dates.ts";
import { toWorker } from "./crew-status.ts";
import type { WorkerRow } from "./auth.ts";

const SHIFT_COLS = "id, project_id, project_name, work_date, clock_in_at, clock_out_at, break_minutes, worked_minutes";
const hours = (minutes: number) => (minutes / 60).toFixed(2);

type ShiftRow = {
  id: string;
  project_id: string;
  project_name: string;
  work_date: string;
  clock_in_at: string;
  clock_out_at: string | null;
  break_minutes: number;
  worked_minutes: number | null;
  worker_id: string;
  clock_in_lat: number | null;
  clock_in_lng: number | null;
  clock_in_accuracy: number | null;
  clock_out_lat: number | null;
  clock_out_lng: number | null;
};

/** Ported verbatim (logic-wise) from the source app's crew.server.ts adminBoard(). */
export async function adminBoard(pin: string) {
  requireAdminPin(pin);
  const db = adminClient();
  const today = workDate();
  const weekAgo = new Date(Date.now() - 6 * 86400000);
  const weekStart = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(weekAgo);

  const [{ data: workerRows }, { data: shiftRows }, { data: safetyRows }, { data: incidentRows }] = await Promise.all([
    db.from("crew_workers").select("id, name, phone, role, active").order("name"),
    db
      .from("crew_shifts")
      .select(`${SHIFT_COLS}, worker_id, clock_in_lat, clock_in_lng, clock_in_accuracy, clock_out_lat, clock_out_lng`)
      .gte("work_date", weekStart)
      .order("clock_in_at", { ascending: false }),
    db.from("crew_safety_checks").select("worker_id, project_name, flagged, note, work_date").eq("work_date", today),
    db
      .from("crew_incidents")
      .select("id, worker_id, project_name, kind, description, urgent, work_date, status, photo_urls, created_at")
      .gte("work_date", weekStart)
      .order("created_at", { ascending: false }),
  ]);

  const workers = ((workerRows ?? []) as unknown as (WorkerRow & { active: boolean })[]).map((w) => ({
    ...toWorker(w),
    active: w.active,
  }));
  const nameOf = (id: string) => workers.find((w) => w.id === id)?.name ?? "Unknown";

  const shifts = (shiftRows ?? []) as unknown as ShiftRow[];
  const openIds = shifts.filter((s) => !s.clock_out_at).map((s) => s.id);
  let openBreakShiftIds = new Set<string>();
  if (openIds.length) {
    const { data } = await db.from("crew_breaks").select("shift_id").in("shift_id", openIds).is("ended_at", null);
    openBreakShiftIds = new Set(((data ?? []) as { shift_id: string }[]).map((b) => b.shift_id));
  }

  const nowIso = new Date().toISOString();
  const onSite = shifts
    .filter((s) => !s.clock_out_at)
    .map((s) => ({
      workerId: s.worker_id,
      worker: nameOf(s.worker_id),
      project: s.project_name,
      clockIn: clockTime(s.clock_in_at),
      onBreak: openBreakShiftIds.has(s.id),
      minutes: Math.max(0, minutesBetween(s.clock_in_at, nowIso) - (s.break_minutes ?? 0)),
      lat: s.clock_in_lat,
      lng: s.clock_in_lng,
      accuracy: s.clock_in_accuracy,
    }));

  const todayList = shifts
    .filter((s) => s.work_date === today)
    .map((s) => ({
      worker: nameOf(s.worker_id),
      project: s.project_name,
      clockIn: clockTime(s.clock_in_at),
      clockOut: s.clock_out_at ? clockTime(s.clock_out_at) : "—",
      breakMinutes: s.break_minutes ?? 0,
      hours: hours(s.worked_minutes ?? Math.max(0, minutesBetween(s.clock_in_at, nowIso) - (s.break_minutes ?? 0))),
      lat: s.clock_in_lat,
      lng: s.clock_in_lng,
      accuracy: s.clock_in_accuracy,
      outLat: s.clock_out_lat,
      outLng: s.clock_out_lng,
    }));

  const perWorker = new Map<string, { minutes: number; days: Set<string> }>();
  for (const s of shifts) {
    const entry = perWorker.get(s.worker_id) ?? { minutes: 0, days: new Set<string>() };
    entry.minutes += s.worked_minutes ?? 0;
    if (s.worked_minutes != null) entry.days.add(s.work_date);
    perWorker.set(s.worker_id, entry);
  }
  const week = [...perWorker.entries()]
    .map(([id, v]) => ({ worker: nameOf(id), hours: hours(v.minutes), days: v.days.size }))
    .sort((a, b) => Number(b.hours) - Number(a.hours));

  const safety = ((safetyRows ?? []) as { worker_id: string; project_name: string; flagged: boolean; note: string }[]).map(
    (r) => ({ worker: nameOf(r.worker_id), project: r.project_name, flagged: r.flagged, note: r.note ?? "" }),
  );

  const incidents = (
    (incidentRows ?? []) as {
      id: string;
      worker_id: string;
      project_name: string;
      kind: string;
      description: string;
      urgent: boolean;
      work_date: string;
      status: string | null;
      photo_urls: string[] | null;
      created_at: string;
    }[]
  ).map((r) => ({
    id: r.id,
    worker: nameOf(r.worker_id),
    project: r.project_name,
    kind: r.kind,
    description: r.description,
    urgent: r.urgent,
    date: r.work_date,
    time: clockTime(r.created_at),
    status: r.status ?? "Open",
    photos: (r.photo_urls ?? []).filter(Boolean),
  }));

  return { workers, onSite, today: todayList, week, safety, incidents };
}
