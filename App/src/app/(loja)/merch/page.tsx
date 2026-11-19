// FICHEIRO: merch/page.tsx
// A página do Merch ( /merch ). É parecida com a página dos Jogos, mas só mostra merch
// e não tem os filtros de plataforma nem de aluguer.
// Filtros no endereço: ?categoria=&promo=1&ordem=&layout=lista

import type { Metadata } from "next";
import { getCategories, getProducts, type ProductFilters } from "@/server/data";
import { CatalogToolbar } from "@/components/shop/catalog-toolbar";
import { CatalogList } from "@/components/shop/catalog-list";
import { Container, PageTitle } from "@/components/layout/page-title";

export const metadata: Metadata = { title: "Merch" };
// A página é refeita a CADA pedido (os dados mudam: stock, preços, eventos), em vez de ficar guardada desde o build.
export const dynamic = "force-dynamic";

export default async function MerchPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  // Vai buscar o merch (com os filtros escolhidos) e as categorias de merch, ao mesmo tempo.
  const [products, categories] = await Promise.all([
    getProducts({
      type: "merch",
      category: sp.categoria,
      onSale: sp.promo === "1",
      sort: (sp.ordem as ProductFilters["sort"]) ?? "popular",
    }),
    getCategories("merch"),
  ]);

  return (
    <Container className="space-y-10 pb-6">
      <PageTitle className="pb-0">Merch</PageTitle>
      <CatalogToolbar categories={categories} />
      <CatalogList products={products} layout={sp.layout === "lista" ? "lista" : "grelha"} />
    </Container>
  );
}
