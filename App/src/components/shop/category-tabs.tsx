// FICHEIRO: category-tabs.tsx
// Os separadores de categoria. Cada separador é uma ligação normal (o separador ativo vem do endereço),
// por isso funciona até sem JavaScript. Usado na página inicial e em /jogos.
// A função `hrefFor` diz para onde cada separador leva (cada página mantém os seus próprios filtros).

import Link from "next/link";
import { cn } from "@/lib/utils";

// A fila de categorias (Figma "Categorias"): Popular, Novos Jogos, Playstation, Xbox, Nintendo, PC.
//  - tabs:   a lista de separadores (id + texto)
//  - active: o id do separador que está ativo
//  - hrefFor: função que diz para onde leva cada separador
export function CategoryTabs({
  tabs,
  active,
  hrefFor,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  hrefFor: (id: string) => string;
}) {
  return (
    <nav aria-label="Categorias" className="grid grid-cols-3 gap-2 sm:flex sm:justify-between sm:gap-4">
      {/* Um botão (ligação) para cada separador. O ativo fica roxo; os outros ficam transparentes. */}
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={hrefFor(t.id)}
          scroll={false}
          aria-current={t.id === active ? "page" : undefined}
          className={cn(
            "chamfer flex h-[30px] items-center justify-center px-2 font-display text-[13px] font-semibold whitespace-nowrap transition [--cut:7px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:w-[101px]",
            t.id === active
              ? "text-white [--ch-fill:var(--brand-700)] [--ch-line:var(--brand-500)]"
              : "text-foreground [--ch-fill:rgb(255_255_255/0.06)] [--ch-line:rgb(185_164_255/0.28)] hover:[--ch-fill:rgb(255_255_255/0.12)] hover:[--ch-line:var(--brand-500)]",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
