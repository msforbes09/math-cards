import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    environmentOptions: { jsdom: { url: "http://localhost:3000" } },
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
});
