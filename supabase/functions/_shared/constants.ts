/**
 * Hand-synced copy of packages/shared/src/constants.ts — Deno Edge Functions
 * don't resolve npm workspace packages, so this tiny, rarely-changing list is
 * duplicated rather than imported. Source of truth: packages/shared/src/constants.ts.
 */
export const SAFETY_ITEMS = [
  { key: "ppe", label: "Hard hat, vest and boots on" },
  { key: "area", label: "Work area clear and marked" },
  { key: "ladders", label: "Ladders / scaffold secure" },
  { key: "tools", label: "Tools and cords inspected" },
  { key: "fit", label: "Fit for duty, no injuries" },
] as const;
