// FICHEIRO: product-card.tsx
// Aqui estão as 3 formas de mostrar artigos:
//   - ProductCard → um cartão de artigo (para a grelha)
//   - ProductRow  → uma linha de artigo (para o modo lista)
//   - ProductGrid → a grelha que junta vários cartões
// Usados na página inicial, Jogos, Merch, Promoções, Pesquisa e na página de produto.

import Link from "next/link";
import { ArtPlaceholder } from "./art-placeholder";
import { AddToCartButton } from "./add-to-cart";
import { finalPrice, formatEuro, platformLabel } from "@/lib/format";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Stagger, StaggerItem } from "@/components/motion/primitives";

// Um cartão de artigo (Figma "Item" + "Adicionar ao carrinho").
// Se `showDiscountTag` for true, mostra a etiqueta "-X%" no canto (usado na página de Promoções).
export function ProductCard({ product, showDiscountTag = false }: { product: Product; showDiscountTag?: boolean }) {
  // Escolhe o tipo de ícone da arte: merch, tabuleiro, PC ou jogo normal.
  const kind = product.type === "merch" ? "merch" : product.platform === "tabuleiro" ? "tabuleiro" : product.platform === "pc" ? "pc" : "jogo";
  // O preço final, já com o desconto.
  const price = finalPrice(product);

  return (
    <div className="group/card relative transition duration-300 ease-[var(--ease-apple)] hover:-translate-y-1.5 hover:drop-shadow-[0_14px_22px_rgb(107_60_240/0.35)]">
      {/* A etiqueta amarela com o desconto, no canto superior esquerdo. */}
      {showDiscountTag && product.discount_percent > 0 && (
        <span className="chamfer absolute -top-4 -left-3 z-10 grid h-[42px] w-[42px] place-items-center font-display text-[13px] font-bold text-brand-950 [--ch-fill:var(--spark)] [--cut:9px]">
          -{product.discount_percent}%
        </span>
      )}
      <article className="cut-tr bg-white/10 p-px transition-colors [--cut:13px] group-hover/card:bg-brand-500">
        <div className="cut-tr flex flex-col overflow-hidden bg-card [--cut:12.6px]">
        {/* A parte de cima do cartão (imagem + nome + preço) é uma ligação para a página do produto. */}
        <Link href={`/produto/${product.slug}`} className="group relative block">
          <ArtPlaceholder color={product.color} kind={kind} image={product.image_url} className="aspect-[178/139] w-full" />
          {/* Em cima: o nome e a etiqueta "Novo" (se for novidade). */}
          <div className={cn("absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2", showDiscountTag && product.discount_percent > 0 && "pl-9")}>
            <span className="line-clamp-2 font-display text-sm leading-tight font-semibold text-white drop-shadow">{product.name}</span>
            {product.is_new && <span className="mr-1.5 shrink-0 bg-spark px-1.5 py-0.5 font-display text-[11px] leading-none font-bold text-brand-950">Novo</span>}
          </div>
          {/* Em baixo: a plataforma (ou categoria) e o preço. Com desconto, mostra o preço antigo riscado. */}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-2 text-white">
            <span className="font-display text-[11px] font-medium text-white/75">{product.platform ? platformLabel[product.platform] : product.category}</span>
            <span className="text-right">
              {product.discount_percent > 0 && (
                <span className="block text-[11px] leading-none text-white/60 line-through sm:mr-1.5 sm:inline">{formatEuro(product.price_cents)}</span>
              )}
              <span className={cn("font-display text-base font-bold", product.discount_percent > 0 && "text-spark")}>{formatEuro(price)}</span>
            </span>
          </div>
        </Link>
        {/* O botão "Adicionar ao carrinho" no fim do cartão. */}
        <AddToCartButton product={product} />
        </div>
      </article>
    </div>
  );
}

// Uma linha de artigo, para o modo lista ("Layout 2" nas páginas Jogos e Merch).
export function ProductRow({ product }: { product: Product }) {
  const kind = product.type === "merch" ? "merch" : product.platform === "tabuleiro" ? "tabuleiro" : "jogo";
  return (
    <article className="flex overflow-hidden border border-white/10 bg-card transition duration-300 ease-[var(--ease-apple)] hover:-translate-y-0.5 hover:border-brand-500/60 hover:shadow-[0_10px_30px_-10px_rgb(107_60_240/0.5)]">
      {/* A imagem à esquerda. */}
      <Link href={`/produto/${product.slug}`} className="shrink-0">
        <ArtPlaceholder color={product.color} kind={kind} image={product.image_url} imageSizes="160px" size="sm" className="h-full min-h-28 w-28 sm:w-40" />
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3 sm:flex-row sm:items-center sm:gap-4">
        {/* O meio: nome, plataforma/categoria e uma descrição curta (no máximo 2 linhas). */}
        <div className="flex-1">
          <Link href={`/produto/${product.slug}`} className="font-display text-[17px] font-semibold text-foreground hover:text-spark">
            {product.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {[product.platform ? platformLabel[product.platform] : null, product.category].filter(Boolean).join(", ")}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        </div>
        {/* A direita: preço (e preço do aluguer, se houver) e o botão de adicionar. */}
        <div className="flex items-center gap-4 sm:flex-col sm:items-end">
          <p className="text-right">
            {product.discount_percent > 0 && <span className="mr-1 text-xs text-muted-foreground line-through">{formatEuro(product.price_cents)}</span>}
            <span className="font-display text-lg font-bold text-foreground">{formatEuro(finalPrice(product))}</span>
            {product.rent_cents_per_day != null && (
              <span className="block text-xs text-muted-foreground">ou {formatEuro(product.rent_cents_per_day)}/dia</span>
            )}
          </p>
          <div className="w-44 overflow-hidden border border-white/15">
            <AddToCartButton product={product} className="border-t-0" />
          </div>
        </div>
      </div>
    </article>
  );
}

// A grelha de cartões: 2 colunas no telemóvel e 4 em ecrãs largos.
// Se não houver artigos, mostra uma mensagem a explicar.
export function ProductGrid({ products, showDiscountTag }: { products: Product[]; showDiscountTag?: boolean }) {
  if (!products.length) {
    return <p className="border border-dashed border-brand-300 bg-white/5 p-10 text-center text-muted-foreground">Não encontrámos artigos com estes critérios.</p>;
  }
  return (
    // Stagger: os cartões aparecem em cascata, um a seguir ao outro, quando a grelha entra no ecrã.
    <Stagger className="grid grid-cols-2 gap-x-4 gap-y-6 sm:gap-x-8 md:grid-cols-4">
      {products.map((p, i) => (
        <StaggerItem key={p.id} index={i}>
          <ProductCard product={p} showDiscountTag={showDiscountTag} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}
