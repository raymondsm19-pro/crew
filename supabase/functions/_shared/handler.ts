import { corsHeaders, handleOptions } from "./cors.ts";
import { HttpError } from "./http-error.ts";

/** Uniform Deno.serve wrapper: OPTIONS/CORS handling + error-to-JSON mapping. */
export function serveJson(fn: (req: Request) => Promise<unknown>) {
  Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return handleOptions(req);
    const headers = { ...corsHeaders(req), "Content-Type": "application/json" };
    try {
      const result = await fn(req);
      return new Response(JSON.stringify(result), { status: 200, headers });
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 400;
      const message = err instanceof Error ? err.message : "Something went wrong.";
      return new Response(JSON.stringify({ error: message }), { status, headers });
    }
  });
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}
