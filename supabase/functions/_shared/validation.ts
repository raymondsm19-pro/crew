/** Ported from the source app's crew.functions.ts inputValidator style — manual, no Zod. */
export const text = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);
export const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

export const coords = (input: { lat?: number; lng?: number; accuracy?: number } | undefined) => ({
  lat: num(input?.lat),
  lng: num(input?.lng),
  accuracy: num(input?.accuracy),
});
