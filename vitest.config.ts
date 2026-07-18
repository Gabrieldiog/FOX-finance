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
    // Os testes são de integração contra UM banco remoto compartilhado (Supabase
    // pooler, conexão max:1 por arquivo). Rodar os arquivos em paralelo criava
    // contenção e estourava o timeout; em série não há disputa. A folga cobre a
    // latência de rede da rodada.
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
