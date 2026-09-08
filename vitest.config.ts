import { defineConfig } from "vitest/config";
import path from "node:path";

// No @vitejs/plugin-react here: vitest transforms TSX through esbuild, and
// `jsx: "automatic"` enables the modern JSX runtime for tests without
// pulling the plugin's duplicate-vite/refresh preamble machinery (which
// breaks under vitest's bundled vite copy and is unnecessary outside dev
// servers — Next handles the app build itself).
export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/lib/**", "src/components/**"],
      exclude: ["src/test/**", "**/*.d.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@/.": path.resolve(__dirname, "."),
    },
  },
});
