import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // `server-only` throws outside React Server Components; pure helpers are tested directly.
      "server-only": path.resolve(__dirname, "./src/__tests__/server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/__tests__/**/*.test.ts", "src/__tests__/**/*.test.tsx"],
  },
});
