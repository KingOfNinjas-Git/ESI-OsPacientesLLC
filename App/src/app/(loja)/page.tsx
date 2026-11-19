// FICHEIRO: (loja)/page.tsx
// A página inicial do site ( / ) — Figma "Home Page".
//
// De cima para baixo mostra:
//   1. o carrossel de Destaques (evento, promoção, novidade...)
//   2. os separadores de categoria (Popular, Xbox, PC...)
//   3. a grelha com 8 jogos
//   4. dois blocos de promoção (aluguer/bar e consolas)
// O separador ativo vem do endereço (`/?tab=xbox`), por isso cada separador é só uma ligação.

import { getFeaturedEvent, getProducts, HOME_TABS, type HomeTab } from "@/server/data";
import { HighlightsCarousel, type Highlight } from "@/components/shop/highlights-carousel";
import { CategoryTabs } from "@/components/shop/category-tabs";
import { ProductGrid } from "@/components/shop/product-card";
import { PromoBanners } from "@/components/shop/promo-banners";
import { Container } from "@/components/layout/page-title";
import { formatDateTime } from "@/lib/format";

// A página é refeita a CADA pedido (os dados mudam: stock, preços, eventos), em vez de ficar guardada desde o build.
export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  // Lê o separador pedido no endereço. Se não existir na nossa lista (ou não vier nada), usa "popular".
  const { tab: rawTab } = await searchParams;
  const tab = (HOME_TABS.some((t) => t.id === rawTab) ? rawTab : "popular") as HomeTab;

  // Faz as 4 consultas à base de dados AO MESMO TEMPO (em paralelo), em vez de uma de cada vez. É bem mais rápido.
  //   products → os 8 jogos da grelha
  //   event    → o evento em destaque
  //   onSale   → o artigo em promoção mais popular
  //   newest   → o jogo mais novo
  const [products, event, onSale, newest] = await Promise.all([
    getProducts({ tab, type: "jogo", limit: 8 }),
    getFeaturedEvent(),
    getProducts({ onSale: true, sort: "popular", limit: 1 }),
    getProducts({ tab: "novos", limit: 1 }),
  ]);

  // Os "slides" do carrossel: evento em destaque, promoção mais popular e novidade
  // (cada um só aparece se existir) mais dois slides fixos (aluguer e merch).
  // O truque `...(x ? [slide] : [])` quer dizer: "se x existe, junta este slide; se não, não junta nada".
  const slides: Highlight[] = [
    ...(event
      ? [{
          eyebrow: "Evento",
          meta: formatDateTime(event.starts_at),
          title: event.name,
          subtitle: event.tagline,
          cta: "Comprar bilhete",
          href: `/eventos/${event.slug}`,
          color: event.color,
        }]
      : []),
    ...(onSale[0]
      ? [{
          eyebrow: "Promoção",
          meta: `-${onSale[0].discount_percent}%`,
          title: onSale[0].name,
          subtitle: "Descontos em jogos e merch durante tempo limitado.",
          cta: "Ver promoções",
          href: "/promocoes",
          color: onSale[0].color,
        }]
      : []),
    ...(newest[0]
      ? [{
          eyebrow: "Novidade",
          title: newest[0].name,
          subtitle: newest[0].description,
          cta: "Ver novos jogos",
          href: "/?tab=novos",
          color: newest[0].color,
        }]
      : []),
    // Slide fixo 1: publicidade ao aluguer de jogos.
    {
      eyebrow: "Aluguer",
      title: "Aluga jogos a partir de 1 € por dia",
      subtitle: "Levanta na loja, joga em casa e devolve quando terminares.",
      cta: "Explorar jogos",
      href: "/jogos?aluguer=1",
      color: "#3d1a8f",
    },
    // Slide fixo 2: publicidade ao merch.
    {
      eyebrow: "Merch",
      title: "Leva a GameHaven contigo",
      subtitle: "T-shirts, hoodies, canecas e acessórios com o nosso globo.",
      cta: "Ver merch",
      href: "/merch",
      color: "#6a3fd6",
    },
  ];

  return (
    <>
      {/* Carrossel grande no topo. */}
      <HighlightsCarousel slides={slides} />
      <Container className="space-y-8 py-6">
        {/* Separadores de categoria. O "popular" volta ao "/" simples; os outros usam "/?tab=nome". */}
        <CategoryTabs tabs={HOME_TABS} active={tab} hrefFor={(id) => (id === "popular" ? "/" : `/?tab=${id}`)} />
        {/* A grelha dos 8 jogos. */}
        <ProductGrid products={products} />
        {/* Os dois blocos de promoção no fim. */}
        <PromoBanners />
      </Container>
    </>
  );
}
