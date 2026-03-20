import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

function loadDotEnv(): Record<string, string> {
  try {
    const content = readFileSync(".env", "utf-8");
    const env: Record<string, string> = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
    }
    return env;
  } catch {
    return {};
  }
}

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/e2e/**/*.test.ts"],
    testTimeout: 30_000,
    env: loadDotEnv(),
  },
});
