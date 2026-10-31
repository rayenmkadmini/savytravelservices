import { defineConfig } from "vitest/config";

// Integration tests run against a live Supabase stack (see tests/integration).
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
});
