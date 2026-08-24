/**
 * Vanilla TanStack Start Vite config — deliberately NOT reusing the source
 * app's @lovable.dev/vite-tanstack-config wrapper (proprietary to the Lovable
 * platform: dev sandbox detection, MCP plugin, hosted error reporting).
 */
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    // Verified against @tanstack/react-start@1.168.44: tanstackStart()'s type
    // signature has no `target`/`preset`/`nitro` option in this version, so a
    // Cloudflare deploy preset isn't configurable here yet. `vite build`
    // currently emits a generic dist/server/server.js. Revisit against
    // current TanStack Start docs when actually deploying to Cloudflare —
    // this does not block local dev/build/verification.
    tanstackStart(),
    viteReact(),
  ],
  server: {
    port: 3100,
    // Allows any host (e.g. rotating ngrok tunnel subdomains) to reach the dev
    // server — fine for local testing, not meant for a production deployment.
    allowedHosts: true,
  },
});
