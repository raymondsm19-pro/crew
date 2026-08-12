import { serveJson, readJson } from "../_shared/handler.ts";
import { adminBoard } from "../_shared/admin-board.ts";

serveJson(async (req) => {
  const body = await readJson<{ pin?: string }>(req);
  return adminBoard(String(body?.pin ?? ""));
});
