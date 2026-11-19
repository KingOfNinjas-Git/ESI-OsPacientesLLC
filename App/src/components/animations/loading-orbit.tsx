// FICHEIRO: loading-orbit.tsx
// O anel de carregamento: o logótipo da GameHaven com um anel dourado a girar à volta.
// Usado no ecrã de carregamento (app/loading.tsx).
// A rotação (`.loader-orbit`) está em styles/animations.css e pára se a pessoa tiver "reduzir movimento" ligado.

import Image from "next/image";

export function LoadingOrbit() {
  return (
    <div className="relative grid size-[260px] place-items-center">
      {/* O desenho dos anéis (em SVG). Como é só decoração, escondemos dos leitores de ecrã (aria-hidden). */}
      <svg viewBox="0 0 260 260" fill="none" aria-hidden className="loader-orbit absolute inset-0">
        {/* O anel completo, discreto. */}
        <circle cx="130" cy="130" r="124" stroke="#b9a4ff" strokeOpacity="0.25" />
        {/* O pequeno arco dourado que dá a sensação de movimento. */}
        <circle cx="130" cy="130" r="124" stroke="#ffc94d" strokeWidth="2" strokeLinecap="round" strokeDasharray="60 720" />
      </svg>
      {/* O logótipo no meio. */}
      <Image src="/brand/logo.png" alt="GameHaven" width={188} height={188} priority />
    </div>
  );
}
