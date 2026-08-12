import { serveJson, readJson } from "../_shared/handler.ts";
import { adminClient } from "../_shared/supabase-admin.ts";
import { requireWorker } from "../_shared/auth.ts";
import { projectOrThrow } from "../_shared/crew-status.ts";
import { workDate } from "../_shared/dates.ts";
import { text } from "../_shared/validation.ts";
import { HttpError } from "../_shared/http-error.ts";

type FileInput = { fileBase64: string; fileName: string; contentType: string };
type Body = {
  projectId?: string;
  kind?: string;
  description?: string;
  urgent?: boolean;
  files?: FileInput[];
};

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function uploadIncidentFile(projectId: string, file: FileInput): Promise<string> {
  const db = adminClient();
  const safe = file.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `crew-safety/${projectId}/${Date.now()}_${safe}`;
  const { error } = await db.storage
    .from("field-receipts")
    .upload(path, base64ToBytes(file.fileBase64), {
      contentType: file.contentType || "application/octet-stream",
      upsert: false,
    });
  if (error) throw new Error(error.message);
  const { data } = await db.storage.from("field-receipts").createSignedUrl(path, 60 * 60 * 24 * 365);
  return data?.signedUrl ?? "";
}

serveJson(async (req) => {
  const worker = await requireWorker(req);
  const body = await readJson<Body>(req);

  const projectId = text(body?.projectId);
  const description = text(body?.description, 2000);
  if (!projectId) throw new HttpError(400, "Pick your project first.");
  if (!description) throw new HttpError(400, "Describe what happened.");

  const files = (body?.files ?? []).slice(0, 4).map((f) => {
    const contentType = text(f?.contentType, 100);
    if (!/^(image|video)\//.test(contentType) && contentType !== "application/pdf") {
      throw new HttpError(400, "Only photos, videos or PDFs can be attached.");
    }
    return {
      fileBase64: String(f?.fileBase64 ?? ""),
      fileName: text(f?.fileName, 120) || "photo",
      contentType,
    };
  });
  const kind = text(body?.kind, 40) || "Hazard";
  const urgent = Boolean(body?.urgent);

  const project = await projectOrThrow(projectId);
  const db = adminClient();

  const urls: string[] = [];
  for (const file of files) {
    try {
      urls.push(await uploadIncidentFile(project.id, file));
    } catch (err) {
      console.error("[crew-report-incident] file upload failed", err);
    }
  }

  const today = workDate();
  const { error } = await db.from("crew_incidents").insert({
    worker_id: worker.id,
    project_id: project.id,
    project_name: project.label,
    work_date: today,
    kind,
    description: description.slice(0, 2000),
    photo_urls: urls,
    urgent,
  });
  if (error) throw new HttpError(500, `Couldn't file the report: ${error.message}`);

  // Note: the source app also mirrored this to Google Sheets (syncIncident) — dropped.

  return { ok: true };
});
