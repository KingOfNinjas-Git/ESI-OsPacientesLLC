// FICHEIRO: planet.tsx
// Ilustrações em SVG inspiradas no logótipo (globo em "wireframe", anel, estrelas):
//   - Sparkle:    estrela de 4 pontas (usada em títulos e etiquetas)
//   - Planet:     planeta com anel (usado no carrossel de Destaques)
//   - OrbitLines: anéis de órbita discretos (fundo dos cartões e blocos)
// São só decoração (aria-hidden): os leitores de ecrã ignoram-nas.

import { cn } from "@/lib/utils";

// A estrela de quatro pontas, a mesma "faísca" do logótipo.
export function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="-10 -10 20 20" aria-hidden className={cn("size-3 fill-current", className)}>
      <path d="M0 -10C1 -2.5 2.5 -1 10 0C2.5 1 1 2.5 0 10C-1 2.5 -2.5 1 -10 0C-2.5 -1 -1 -2.5 0 -10Z" />
    </svg>
  );
}

// Os "meridianos" (linhas de cima a baixo) e os "paralelos" (linhas deitadas) do globo.
// Os meridianos são a largura de cada elipse; os paralelos são a altura de cada linha.
const MERIDIANS = [80, 58, 30];
const LATITUDES = [-56, -28, 0, 28, 56];

// O planeta em wireframe com anel, desenhado a partir do logótipo da GameHaven.
//  - color: a cor principal do planeta
//  - id:    um identificador único (para o degradé de cada planeta não se misturar com o dos outros)
// Cada linha usa pathLength=1 para poder ser "desenhada" aos poucos (ver .planet-line em styles/animations.css).
export function Planet({ color, id, className }: { color: string; id: string; className?: string }) {
  // O raio do planeta.
  const r = 80;
  return (
    <svg viewBox="0 0 240 240" fill="none" aria-hidden className={className}>
      <defs>
        {/* O degradé que dá volume à esfera: mais claro no canto de cima à esquerda, mais escuro no resto. */}
        <radialGradient id={`planet-fill-${id}`} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor="#250663" stopOpacity="1" />
        </radialGradient>
      </defs>

      <g transform="rotate(-16 120 120)" stroke="#b9a4ff" strokeLinecap="round">
        {/* A metade de trás do anel (desenhada ANTES da esfera, para ficar escondida atrás dela). */}
        <path className="planet-line" pathLength={1} d="M2 120 A118 28 0 0 1 238 120" strokeWidth="1.2" opacity="0.45" />
      </g>

      {/* A esfera do planeta. */}
      <circle cx="120" cy="120" r={r} fill={`url(#planet-fill-${id})`} />

      <g stroke="#e9e3fb" strokeWidth="1.1" opacity="0.8">
        {/* As linhas de cima a baixo. */}
        {MERIDIANS.map((rx) => (
          <ellipse key={rx} className="planet-line" pathLength={1} cx="120" cy="120" rx={rx} ry={r} />
        ))}
        {/* As linhas deitadas. Quanto mais longe do meio, mais pequena é a elipse (por isso o cálculo com a raiz quadrada). */}
        {LATITUDES.map((y) => {
          const rx = Math.sqrt(r * r - y * y);
          return <ellipse key={y} className="planet-line" pathLength={1} cx="120" cy={120 + y} rx={rx} ry={rx * 0.16} />;
        })}
      </g>

      <g transform="rotate(-16 120 120)" stroke="#b9a4ff" strokeLinecap="round">
        {/* A metade da frente do anel (desenhada DEPOIS da esfera, para ficar por cima dela). */}
        <path className="planet-line" pathLength={1} d="M2 120 A118 28 0 0 0 238 120" strokeWidth="1.6" />
      </g>

      {/* Três estrelinhas decorativas à volta do planeta. */}
      <g fill="#ffc94d">
        <path transform="translate(206 38) scale(1.3)" d="M0 -10C1 -2.5 2.5 -1 10 0C2.5 1 1 2.5 0 10C-1 2.5 -2.5 1 -10 0C-2.5 -1 -1 -2.5 0 -10Z" />
        <path transform="translate(224 70) scale(0.55)" fill="#ffffff" d="M0 -10C1 -2.5 2.5 -1 10 0C2.5 1 1 2.5 0 10C-1 2.5 -2.5 1 -10 0C-2.5 -1 -1 -2.5 0 -10Z" />
        <path transform="translate(22 196) scale(0.7)" fill="#ffffff" opacity="0.7" d="M0 -10C1 -2.5 2.5 -1 10 0C2.5 1 1 2.5 0 10C-1 2.5 -2.5 1 -10 0C-2.5 -1 -1 -2.5 0 -10Z" />
      </g>
    </svg>
  );
}

// Anéis de órbita para fundos escuros (cartões e blocos). Só decoração.
export function OrbitLines({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" aria-hidden className={cn("pointer-events-none", className)} preserveAspectRatio="xMidYMid meet">
      <g stroke="currentColor" strokeWidth="1">
        <circle cx="140" cy="150" r="58" />
        <ellipse cx="140" cy="150" rx="58" ry="14" />
        <ellipse cx="140" cy="150" rx="26" ry="58" />
        <ellipse cx="140" cy="150" rx="96" ry="26" transform="rotate(-16 140 150)" opacity="0.7" />
      </g>
    </svg>
  );
}
