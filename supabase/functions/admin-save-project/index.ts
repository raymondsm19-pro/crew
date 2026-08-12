import { serveJson, readJson } from "../_shared/handler.ts";
import { saveProject } from "../_shared/projects.ts";

type Body = { pin?: string; id?: string; name?: string; active?: boolean };

serveJson(async (req) => {
  const body = await readJson<Body>(req);
  return saveProject({
    pin: String(body?.pin ?? ""),
    id: body?.id ? String(body.id) : undefined,
    name: String(body?.name ?? ""),
    active: body?.active,
  });
});
