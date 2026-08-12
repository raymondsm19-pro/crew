import { serveJson } from "../_shared/handler.ts";
import { adminClient } from "../_shared/supabase-admin.ts";
import { requireWorker } from "../_shared/auth.ts";
import { crewStatusFor } from "../_shared/crew-status.ts";
import { HttpError } from "../_shared/http-error.ts";

serveJson(async (req) => {
  const worker = await requireWorker(req);
  const db = adminClient();

  const { data: shifts } = await db
    .from("crew_shifts")
    .select("id")
    .eq("worker_id", worker.id)
    .is("clock_out_at", null)
    .limit(1);
  const shift = (shifts ?? [])[0] as { id: string } | undefined;
  if (!shift) throw new HttpError(409, "Clock in before starting a break.");

  const { data: open } = await db
    .from("crew_breaks")
    .select("id")
    .eq("shift_id", shift.id)
    .is("ended_at", null)
    .limit(1);
  if ((open ?? []).length) throw new HttpError(409, "You're already on a break.");

  const { error } = await db.from("crew_breaks").insert({
    shift_id: shift.id,
    worker_id: worker.id,
    kind: "meal",
    started_at: new Date().toISOString(),
  });
  if (error) throw new HttpError(500, `Couldn't start the break: ${error.message}`);

  return crewStatusFor(worker);
});
