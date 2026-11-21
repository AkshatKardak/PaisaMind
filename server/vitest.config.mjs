import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: "forks",
    coverage: {
      exclude: [
        "node_modules/**",
        "tests/**",
        "controllers/**",
        "routes/**",
        "middleware/**",
        "jobs/**",
        "scripts/**",
        "index.js",
      ],
    },
  },
});
