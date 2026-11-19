// FICHEIRO: produto/[slug]/page.tsx
// A página de UM artigo ( /produto/<slug> ).
// Mostra a capa, a descrição, o preço e desconto, o aluguer, o stock, o botão "Adicionar ao carrinho"
// e até 4 artigos parecidos (do mesmo tipo e plataforma).
// A pasta chama-se [slug] com parêntesis retos porque essa parte do endereço muda de artigo para artigo.

import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/server/data";
import { ArtPlaceholder } from "@/components/shop/art-placeholder";
import { AddToCartButton } from "@/components/shop/add-to-cart";
import { ProductGrid } from "@/components/shop/product-card";
import { BackButton } from "@/components/auth/back-button";
import { Container } from "@/components/layout/page-title";
import { Reveal } from "@/components/motion/primitives";
import { finalPrice, formatEuro, platformLabel } from "@/lib/format";

// A página é refeita a CADA pedido (os dados mudam: stock, preços, eventos), em vez de ficar guardada desde o build.
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

// Define o título do separador do browser: o nome do artigo.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  return { title: p?.name ?? "Artigo" };
}

export default async function ProductPage({ params }: Props) {
  // Procura o artigo pelo slug que vem no endereço. Se não existir, mostra a página 404.
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();
  // Artigos parecidos: pede 5 do mesmo tipo e plataforma, tira o próprio artigo e fica com no máximo 4.
  const related = (
    await getProducts({ type: product.type, platform: product.platform ?? undefined, limit: 5 })
  ).filter((p) => p.id !== product.id).slice(0, 4);

  // Que tipo de ícone usar na "arte" gerada (só serve quando o artigo não tem capa).
  const kind = product.type === "merch" ? "merch" : product.platform === "tabuleiro" ? "tabuleiro" : "jogo";

  return (
    <Container className="space-y-10 py-6">
      <BackButton />
      {/* Duas colunas em ecrãs grandes: imagem à esquerda, informação à direita. */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* "Reveal" faz o bloco aparecer com uma animação suave. */}
        <Reveal y={30}>
        {/* Se o artigo tem capa mostra-a; senão mostra a arte gerada a partir da cor. */}
        {product.image_url ? (
          <div className="cut-tr relative grid aspect-[4/3] place-items-center overflow-hidden bg-brand-950 [--cut:28px]">
            {/* Fundo: a própria capa, desfocada. À frente: a capa inteira, sem cortes. */}
            <Image src={product.image_url} alt="" fill sizes="50vw" className="scale-110 object-cover opacity-50 blur-2xl" />
            <Image src={product.image_url} alt={`Capa de ${product.name}`} fill priority sizes="40vw" className="object-contain p-[6%] drop-shadow-[0_12px_28px_rgb(0_0_0/0.55)]" />
          </div>
        ) : (
          <ArtPlaceholder color={product.color} kind={kind} label={product.name} size="lg" className="cut-tr aspect-[4/3] [--cut:28px]" />
        )}
        </Reveal>
        <Reveal y={30} delay={0.12} className="space-y-4">
        <div className="space-y-4">
          {/* Linha pequena com o caminho: ex. "Jogo / PlayStation / RPG". O filter(Boolean) tira o que estiver vazio. */}
          <p className="font-display text-sm font-semibold text-brand-300">
            {[product.type === "merch" ? "Merch" : "Jogo", product.platform ? platformLabel[product.platform] : null, product.category].filter(Boolean).join(" / ")}
          </p>
          <h1 className="font-display text-4xl leading-tight font-bold text-foreground">{product.name}</h1>
          <p className="text-muted-foreground">{product.description}</p>
          {/* Preço final. Se houver desconto, mostra também o preço antigo riscado e a etiqueta "-X%". */}
          <div className="flex items-baseline gap-3">
            <span className="font-display text-4xl font-bold text-foreground">{formatEuro(finalPrice(product))}</span>
            {product.discount_percent > 0 && (
              <>
                <span className="text-muted-foreground line-through">{formatEuro(product.price_cents)}</span>
                <span className="bg-spark px-2 py-0.5 font-display text-sm font-bold text-brand-950">-{product.discount_percent}%</span>
              </>
            )}
          </div>
          {/* Só aparece se o artigo se puder alugar. */}
          {product.rent_cents_per_day != null && (
            <p className="text-sm text-foreground">
              Também disponível para aluguer: <strong>{formatEuro(product.rent_cents_per_day)} / dia</strong>, com levantamento e devolução na loja.
            </p>
          )}
          <p className="text-sm text-muted-foreground">{product.stock > 0 ? `${product.stock} em stock` : "Esgotado"}</p>
          <div className="max-w-xs overflow-hidden border border-white/15">
            <AddToCartButton product={product} className="border-t-0 py-3 text-sm" />
          </div>
        </div>
        </Reveal>
      </div>
      {/* Se existirem artigos parecidos, mostra-os em baixo. */}
      {related.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-bold text-foreground">Também te pode interessar</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </Container>
  );
}
