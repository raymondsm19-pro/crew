import { serveJson } from "../_shared/handler.ts";
import { listProjects } from "../_shared/projects.ts";

serveJson(async (req) => {
  const pin = req.headers.get("x-admin-pin") ?? new URL(req.url).searchParams.get("pin") ?? "";
  return listProjects(pin);
});
