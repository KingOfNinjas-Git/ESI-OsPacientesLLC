// FICHEIRO: postcss.config.mjs
// Liga o Tailwind CSS ao processamento do CSS. É o que faz as classes tipo "p-4" ou "bg-red-500" funcionarem.
const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default config;
