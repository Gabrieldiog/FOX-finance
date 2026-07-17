import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    // `server-only` não é resolvível fora do Next; nos testes vira um no-op.
    alias: { "server-only": resolve(import.meta.dirname, "test/server-only-stub.ts") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
