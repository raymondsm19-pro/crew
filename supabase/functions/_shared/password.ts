/**
 * Ported verbatim from the source app's crew.server.ts. Deno's crypto.subtle
 * has the same PBKDF2/deriveBits API the source's Worker runtime uses.
 */
const ITERATIONS = 100_000;
const b64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array, iterations = ITERATIONS): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as unknown as BufferSource, iterations, hash: "SHA-256" },
    key,
    256,
  );
  return b64(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt);
  return `pbkdf2$${ITERATIONS}$${b64(salt.buffer as ArrayBuffer)}$${hash}`;
}

export async function passwordMatches(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]) || ITERATIONS;
  const salt = fromB64(parts[2]!);
  const expected = parts[3]!;
  const actual = await derive(password, salt, iterations);
  if (actual.length !== expected.length) return false;
  // Constant-time compare so a wrong password can't be probed by timing.
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

/** Digits only, keeping the last 10 so (510) 555-1234 and 5105551234 match. */
export function normalizePhone(input: string): string {
  const digits = String(input ?? "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}
