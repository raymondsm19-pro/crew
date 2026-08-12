export const EDGE_FUNCTIONS_URL = (import.meta.env.VITE_EDGE_FUNCTIONS_URL ?? "").replace(/\/$/, "");

if (!EDGE_FUNCTIONS_URL && import.meta.env.DEV) {
  console.warn("[env] VITE_EDGE_FUNCTIONS_URL is not set — admin-web has no backend to call.");
}
