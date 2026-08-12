import { serveJson } from "../_shared/handler.ts";
import { requireWorker } from "../_shared/auth.ts";
import { crewStatusFor } from "../_shared/crew-status.ts";

serveJson(async (req) => {
  const worker = await requireWorker(req);
  return crewStatusFor(worker);
});
