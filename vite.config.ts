// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// The existing production users and content live in this Supabase project.
// Keep browser and SSR pointed at the same backend to prevent function calls
// (including gemini-ai) from being sent to a different Supabase project.
const publicBackendUrl = "https://uluumebztnrgpyzohqrv.supabase.co";
const publicBackendKey = "sb_publishable_R-b9hG7BURmJCmtVG0393w_4AMoonvq";

// Force the same public project reference in both Vite's browser bundle and SSR.
process.env["VITE_SUPABASE_URL"] = publicBackendUrl;
process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] = publicBackendKey;
process.env["SUPABASE_URL"] = publicBackendUrl;
process.env["SUPABASE_PUBLISHABLE_KEY"] = publicBackendKey;

const publicDefines = {
  "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(publicBackendUrl),
  "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(publicBackendKey),
};

export default defineConfig({
  // Keep Lovable's explicit VITE_* replacement enabled for browser bundles.
  envDefine: true,
  vite: {
    define: publicDefines,
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    server: { entry: "server" },
  },
});
