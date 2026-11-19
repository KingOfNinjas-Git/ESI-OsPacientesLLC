// FICHEIRO: page-title.tsx
// Dois blocos de layout usados em quase todas as páginas:
//   - PageTitle: o título centrado, com uma estrelinha de cada lado
//   - Container: limita a largura do conteúdo e dá margens aos lados

import { cn } from "@/lib/utils";
import { Sparkle } from "@/components/animations/planet";
import { Reveal } from "@/components/motion/primitives";

// O título centrado das páginas (Figma: "Promoções", "Jogos", "Merch", "Eventos"...).
// Aparece com uma pequena animação (sobe e fica visível).
export function PageTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Reveal y={14}>
      <h1 className={cn("flex items-center justify-center gap-3 pt-6 pb-5 text-center font-display text-[30px] leading-tight font-bold text-foreground", className)}>
        <Sparkle className="size-3 text-spark" />
        {children}
        <Sparkle className="size-3 text-spark" />
      </h1>
    </Reveal>
  );
}

// Uma "caixa" que centra o conteúdo, com largura máxima de 72rem e margens aos lados.
export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-8", className)}>{children}</div>;
}
