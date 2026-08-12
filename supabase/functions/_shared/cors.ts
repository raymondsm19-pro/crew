/**
 * CORS handling shared by every Edge Function. Bearer tokens are sent
 * explicitly via the Authorization header (never an auto-attached cookie), so
 * a wildcard origin carries no credential-leak risk the way it would for a
 * cookie-based flow. Tighten ALLOWED_ORIGIN to an explicit allow-list (comma-
 * separated) once admin-web's production domain is known.
 */
const allowList = (Deno.env.get("CORS_ALLOWED_ORIGINS") ?? "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function resolveOrigin(req: Request): string {
  if (allowList.includes("*")) return "*";
  const origin = req.headers.get("origin") ?? "";
  return allowList.includes(origin) ? origin : allowList[0] ?? "*";
}

export function corsHeaders(req: Request): HeadersInit {
  return {
    "Access-Control-Allow-Origin": resolveOrigin(req),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-pin",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    Vary: "Origin",
  };
}

export function handleOptions(req: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}
