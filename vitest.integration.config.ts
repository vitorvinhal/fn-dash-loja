import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.ts"],
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    environment: "node",
    env: {
      TEST_SUPABASE_URL: process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      TEST_SUPABASE_KEY: process.env.TEST_SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    },
    setupFiles: ["tests/setup/integration-setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
