// FICHEIRO: eslint.config.mjs
// Configuração do ESLint: um "corretor ortográfico" para código, que avisa de erros e más práticas.
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

// Descobrimos em que pasta estamos, porque o FlatCompat precisa de saber onde procurar as regras.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Usamos as regras recomendadas do Next.js e do TypeScript.
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Pastas e ficheiros que o ESLint deve ignorar (não são código escrito por nós).
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "electron/dist/**", // código gerado por `npm run electron:compile`
    ],
  },
];

export default eslintConfig;
