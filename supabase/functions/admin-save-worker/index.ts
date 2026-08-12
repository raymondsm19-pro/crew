import { serveJson, readJson } from "../_shared/handler.ts";
import { adminClient } from "../_shared/supabase-admin.ts";
import { requireAdminPin } from "../_shared/auth.ts";
import { adminBoard } from "../_shared/admin-board.ts";
import { hashPassword, normalizePhone } from "../_shared/password.ts";
import { text } from "../_shared/validation.ts";
import { HttpError } from "../_shared/http-error.ts";

type Body = {
  pin?: string;
  id?: string;
  name?: string;
  phone?: string;
  role?: string;
  password?: string;
  active?: boolean;
};

serveJson(async (req) => {
  const body = await readJson<Body>(req);
  const pin = String(body?.pin ?? "");
  requireAdminPin(pin);

  const id = text(body?.id, 60) || undefined;
  const name = text(body?.name, 80);
  const phone = normalizePhone(text(body?.phone, 25));
  const role = text(body?.role, 60);
  const password = body?.password ? String(body.password) : undefined;
  const active = body?.active;

  const db = adminClient();

  if (id) {
    const patch: Record<string, unknown> = { name, role, active: active ?? true };
    if (phone.length === 10) patch.phone = phone;
    if (password) patch.password_hash = await hashPassword(password);
    const { error } = await db.from("crew_workers").update(patch).eq("id", id);
    if (error) throw new HttpError(500, `Couldn't save the worker: ${error.message}`);
  } else {
    if (!name.trim()) throw new HttpError(400, "Enter the worker's name.");
    if (phone.length !== 10) throw new HttpError(400, "Enter a 10-digit phone number.");
    if (!password || password.length < 4) throw new HttpError(400, "Set a password of at least 4 characters.");
    const { error } = await db.from("crew_workers").insert({
      name: name.trim(),
      phone,
      role: role.trim(),
      password_hash: await hashPassword(password),
      active: true,
    });
    if (error) {
      const dup = error.code === "23505" || /duplicate/i.test(error.message);
      throw new HttpError(
        dup ? 409 : 500,
        dup ? "That phone number is already on the crew list." : `Couldn't add the worker: ${error.message}`,
      );
    }
  }

  return adminBoard(pin);
});
