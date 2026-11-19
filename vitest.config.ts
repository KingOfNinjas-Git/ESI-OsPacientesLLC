// FICHEIRO: vitest.config.ts
// Configuração dos testes automáticos (correm com `npm test`).
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // O "@" é um atalho para a pasta src (igual ao que está no tsconfig), para os imports funcionarem nos testes.
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  // Só corre os ficheiros de teste que acabam em ".test.ts" dentro da pasta src.
  test: { include: ["src/**/*.test.ts"] },
});
