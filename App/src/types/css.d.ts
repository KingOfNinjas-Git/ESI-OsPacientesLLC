// FICHEIRO: css.d.ts
// Diz ao TypeScript que fazer `import "ficheiro.css"` é permitido (ex.: em app/layout.tsx).
// O Next.js é que trata do CSS de verdade; isto só serve para o TypeScript não se queixar
// com o erro "Cannot find module".
declare module "*.css";
