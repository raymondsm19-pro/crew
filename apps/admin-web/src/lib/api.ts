/**
 * Typed fetch client for the admin-facing Edge Functions. admin-web has no
 * direct Supabase client — this is its only way to reach the backend, which
 * keeps all business logic in one place (the Edge Functions) instead of
 * duplicating it here.
 */
import type {
  AdminBoardResponse,
  AdminListProjectsResponse,
  AdminSaveProjectRequest,
  AdminSaveProjectResponse,
  AdminSaveWorkerRequest,
} from "@crew/shared";
import { EDGE_FUNCTIONS_URL } from "./env";

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${EDGE_FUNCTIONS_URL}/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string })?.error ?? "Something went wrong.");
  return body as T;
}

export const api = {
  adminBoard: (pin: string) =>
    call<AdminBoardResponse>("admin-board", { method: "POST", body: JSON.stringify({ pin }) }),

  saveWorker: (input: AdminSaveWorkerRequest) =>
    call<AdminBoardResponse>("admin-save-worker", { method: "POST", body: JSON.stringify(input) }),

  listProjects: (pin: string) =>
    call<AdminListProjectsResponse>("admin-list-projects", { headers: { "x-admin-pin": pin } }),

  saveProject: (input: AdminSaveProjectRequest) =>
    call<AdminSaveProjectResponse>("admin-save-project", { method: "POST", body: JSON.stringify(input) }),
};
