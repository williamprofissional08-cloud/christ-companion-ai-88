// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Keep the browser URL/key paired; build environment variables may belong to different Supabase projects.
const publicBackendUrl = "https://uluumebztnrgpyzohqrv.supabase.co";
const publicBackendKey = "sb_publishable_R-b9hG7BURmJCmtVG0393w_4AMoonvq";
process.env["VITE_SUPABASE_URL"] = publicBackendUrl;
process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] = publicBackendKey;

const publicDefines = {
  "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(publicBackendUrl),
  "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(publicBackendKey),
};

export default defineConfig({
  envDefine: true,
  vite: {
    define: publicDefines,
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
