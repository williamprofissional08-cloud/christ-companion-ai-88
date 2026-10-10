// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

const publicEnv = loadEnv(process.env["NODE_ENV"] ?? "production", process.cwd(), "VITE_");
const publicBackendUrl = publicEnv["VITE_SUPABASE_URL"];
const publicBackendKey = publicEnv["VITE_SUPABASE_PUBLISHABLE_KEY"];

// Keep explicit public defines only when the corresponding local build values exist.
// Never ship a fallback URL/key from another Supabase project.
const publicDefines =
  publicBackendUrl && publicBackendKey
    ? {
        "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(publicBackendUrl),
        "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(publicBackendKey),
      }
    : {};

export default defineConfig({
  // Keep Lovable's explicit VITE_* replacement enabled for browser bundles.
  // The generated browser client reads these public values at runtime.
  envDefine: true,
  vite: {
    define: publicDefines,
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
