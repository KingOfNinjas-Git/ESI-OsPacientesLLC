// FICHEIRO: loading.tsx
// O ecrã de "a carregar" (Figma "Loading Screen"): o logótipo em cima do fundo roxo #18063A.
// O Next.js mostra este ecrã sozinho enquanto uma página demora a carregar.
// A animação do logótipo está em components/animations/loading-orbit.tsx.

import { LoadingOrbit } from "@/components/animations/loading-orbit";

export default function Loading() {
  return (
    // Cobre o ecrã inteiro (fixed inset-0), fica por cima de tudo (z-50) e centra o logótipo.
    // O role="status" e o aria-label servem para os leitores de ecrã dizerem "A carregar".
    <div className="starfield fixed inset-0 z-50 grid place-items-center bg-brand-950" role="status" aria-label="A carregar">
      <LoadingOrbit />
    </div>
  );
}
