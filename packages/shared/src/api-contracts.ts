/**
 * Request/response shapes for every Supabase Edge Function. Single source of
 * truth consumed by both apps' API clients (Edge Functions keep a hand-synced
 * copy under supabase/functions/_shared, since Deno doesn't resolve npm
 * workspace packages).
 */
import type { AdminBoard, CrewStatus, Project } from "./types";

export type Coords = { lat?: number; lng?: number; accuracy?: number };

export type CrewSignInRequest = { phone: string; password: string };
export type CrewSignInResponse = { token: string; expiresAt: string; status: CrewStatus };

export type CrewStatusResponse = CrewStatus | null;

export type CrewClockInRequest = Coords & {
  projectId: string;
  safety: Record<string, boolean>;
  safetyNote?: string;
};

export type CrewClockOutRequest = Coords & { note?: string };

export type CrewReportIncidentRequest = {
  projectId: string;
  kind: string;
  description: string;
  urgent?: boolean;
  files?: { fileBase64: string; fileName: string; contentType: string }[];
};

export type AdminBoardRequest = { pin: string };
export type AdminBoardResponse = AdminBoard;

export type AdminSaveWorkerRequest = {
  pin: string;
  id?: string;
  name: string;
  phone: string;
  role?: string;
  password?: string;
  active?: boolean;
};

export type AdminListProjectsResponse = Project[];

export type AdminSaveProjectRequest = {
  pin: string;
  id?: string;
  name: string;
  active?: boolean;
};
export type AdminSaveProjectResponse = Project[];

export type ApiError = { error: string };
