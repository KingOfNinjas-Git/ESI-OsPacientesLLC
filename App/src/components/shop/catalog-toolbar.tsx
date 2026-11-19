// FICHEIRO: catalog-toolbar.tsx
// Os botões "Layout 1 / Layout 2" e a barra de Filtros das páginas Jogos e Merch.
//
// Os filtros não guardam nada por conta própria: cada escolha muda um parâmetro do endereço
// (ex.: ?plataforma=xbox) e a página, no servidor, volta a pedir os produtos certos.
//
// "use client": corre no browser, porque muda o endereço quando escolhes um filtro.

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

// A barra completa: botões de layout + filtros.
//  - categories:     lista de categorias para o filtro
//  - platforms:      lista de plataformas (só nos Jogos)
//  - showRentFilter: mostra a opção "Disponível para aluguer" (só nos Jogos)
export function CatalogToolbar({
  categories,
  platforms,
  showRentFilter,
}: {
  categories: string[];
  platforms?: { id: string; label: string }[];
  showRentFilter?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  // Lê do endereço qual o layout atual (lista ou grelha).
  const layout = params.get("layout") === "lista" ? "lista" : "grelha";

  // Define um parâmetro do endereço (ou remove-o, se `value` for null). Não faz a página saltar para o topo.
  function set(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  // O aspeto comum a todas as listas de escolha.
  const selectCls = "h-8 rounded-sm border border-white/15 bg-card px-2 text-[13px] text-foreground transition hover:border-brand-500/60 focus:ring-2 focus:ring-brand-500 focus:outline-none";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-8">
      {/* Os dois botões de layout. O que está ativo fica roxo. */}
      <div className="flex gap-4 sm:gap-16">
        {[
          { id: "grelha", label: "Layout 1", icon: LayoutGrid },
          { id: "lista", label: "Layout 2", icon: List },
        ].map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => set("layout", l.id === "grelha" ? null : l.id)}
            aria-pressed={layout === l.id}
            className={cn(
              "chamfer flex size-[57px] flex-col items-center justify-center gap-1 font-display text-[11px] font-semibold transition [--cut:9px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
              layout === l.id
                ? "text-white [--ch-fill:var(--brand-700)]"
                : "text-foreground [--ch-fill:rgb(255_255_255/0.06)] [--ch-line:rgb(185_164_255/0.28)] hover:[--ch-fill:rgb(255_255_255/0.12)] hover:[--ch-line:var(--brand-500)]",
            )}
          >
            <l.icon className="size-5" />
            {l.label}
          </button>
        ))}
      </div>

      {/* A caixa dos filtros. */}
      <div className="flex flex-1 flex-wrap items-center gap-3 border border-white/10 bg-card px-4 py-3">
        <span className="flex items-center gap-1.5 font-display text-sm font-bold text-foreground">
          <SlidersHorizontal className="size-4" /> Filtros
        </span>
        {/* Filtro de plataforma (só aparece se a página enviou a lista de plataformas). */}
        {platforms && (
          <select aria-label="Plataforma" className={selectCls} value={params.get("plataforma") ?? ""} onChange={(e) => set("plataforma", e.target.value || null)}>
            <option value="">Todas as plataformas</option>
            {platforms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        )}
        {/* Filtro de categoria. */}
        <select aria-label="Categoria" className={selectCls} value={params.get("categoria") ?? ""} onChange={(e) => set("categoria", e.target.value || null)}>
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {/* Escolher como ordenar. "popular" é o normal, por isso não precisa de aparecer no endereço. */}
        <select aria-label="Ordenar" className={selectCls} value={params.get("ordem") ?? "popular"} onChange={(e) => set("ordem", e.target.value === "popular" ? null : e.target.value)}>
          <option value="popular">Mais populares</option>
          <option value="novidades">Novidades</option>
          <option value="preco-asc">Preço: mais baixo</option>
          <option value="preco-desc">Preço: mais alto</option>
          <option value="nome">Nome (A–Z)</option>
        </select>
        {/* Caixinha: só artigos em promoção. */}
        <label className="flex items-center gap-1.5 text-[13px] text-foreground">
          <input type="checkbox" checked={params.get("promo") === "1"} onChange={(e) => set("promo", e.target.checked ? "1" : null)} className="accent-brand-500" />
          Em promoção
        </label>
        {/* Caixinha: só artigos para alugar (só nos Jogos). */}
        {showRentFilter && (
          <label className="flex items-center gap-1.5 text-[13px] text-foreground">
            <input type="checkbox" checked={params.get("aluguer") === "1"} onChange={(e) => set("aluguer", e.target.checked ? "1" : null)} className="accent-brand-500" />
            Disponível para aluguer
          </label>
        )}
      </div>
    </div>
  );
}
