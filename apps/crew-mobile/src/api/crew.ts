import type {
  CrewClockInRequest,
  CrewClockOutRequest,
  CrewReportIncidentRequest,
  CrewSignInRequest,
  CrewSignInResponse,
  CrewStatusResponse,
} from "@crew/shared";
import { call } from "./client";
import { saveToken, clearToken } from "@/auth/token-store";

export async function signIn(input: CrewSignInRequest): Promise<CrewSignInResponse> {
  const res = await call<CrewSignInResponse>("crew-signin", { body: input, auth: false });
  await saveToken(res.token, res.expiresAt);
  return res;
}

export async function signOut(): Promise<void> {
  await call<{ ok: true }>("crew-signout", { body: {} });
  await clearToken();
}

export const getStatus = () => call<CrewStatusResponse>("crew-status", { method: "GET" });

export const clockIn = (input: CrewClockInRequest) => call<NonNullable<CrewStatusResponse>>("crew-clock-in", { body: input });

export const startBreak = () => call<NonNullable<CrewStatusResponse>>("crew-start-break", { body: {} });

export const endBreak = () => call<NonNullable<CrewStatusResponse>>("crew-end-break", { body: {} });

export const clockOut = (input: CrewClockOutRequest) =>
  call<NonNullable<CrewStatusResponse>>("crew-clock-out", { body: input });

export const reportIncident = (input: CrewReportIncidentRequest) =>
  call<{ ok: true }>("crew-report-incident", { body: input });
