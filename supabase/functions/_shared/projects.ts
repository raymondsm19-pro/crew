import { adminClient } from "./supabase-admin.ts";
import { requireAdminPin } from "./auth.ts";
import { text } from "./validation.ts";
import { HttpError } from "./http-error.ts";

export type ProjectRow = { id: string; name: string; active: boolean };

export async function listProjects(pin: string): Promise<ProjectRow[]> {
  requireAdminPin(pin);
  const db = adminClient();
  const { data } = await db.from("projects").select("id, name, active").order("name");
  return (data ?? []) as unknown as ProjectRow[];
}

export async function saveProject(input: {
  pin: string;
  id?: string;
  name: string;
  active?: boolean;
}): Promise<ProjectRow[]> {
  requireAdminPin(input.pin);
  const db = adminClient();
  const name = text(input.name, 120);

  if (input.id) {
    const { error } = await db.from("projects").update({ name, active: input.active ?? true }).eq("id", input.id);
    if (error) throw new HttpError(500, `Couldn't save the project: ${error.message}`);
  } else {
    if (!name) throw new HttpError(400, "Enter the project's name.");
    const { error } = await db.from("projects").insert({ name, active: true });
    if (error) {
      const dup = error.code === "23505" || /duplicate/i.test(error.message);
      throw new HttpError(
        dup ? 409 : 500,
        dup ? "A project with that name already exists." : `Couldn't add the project: ${error.message}`,
      );
    }
  }

  return listProjects(input.pin);
}
