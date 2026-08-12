import Constants from "expo-constants";
import { readToken, clearToken } from "@/auth/token-store";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function edgeFunctionsUrl(): string {
  const url =
    process.env.EXPO_PUBLIC_EDGE_FUNCTIONS_URL ??
    (Constants.expoConfig?.extra?.edgeFunctionsUrl as string | undefined) ??
    "";
  return url.replace(/\/$/, "");
}

type CallOptions = { method?: "GET" | "POST"; body?: unknown; auth?: boolean };

export async function call<T>(path: string, opts: CallOptions = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (opts.auth !== false) {
    const session = await readToken();
    if (session) headers.Authorization = `Bearer ${session.token}`;
  }

  const res = await fetch(`${edgeFunctionsUrl()}/${path}`, {
    method: opts.method ?? (opts.body ? "POST" : "GET"),
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (res.status === 401) {
    // Stale/expired/replayed token — clear it so the app falls back to sign-in.
    await clearToken();
  }
  if (!res.ok) {
    throw new ApiError(res.status, (json as { error?: string })?.error ?? "Something went wrong.");
  }
  return json as T;
}
