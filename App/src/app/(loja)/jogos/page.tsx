// FICHEIRO: jogos/page.tsx
// A página dos Jogos ( /jogos ) — Figma "Jogos".
//
// Todos os filtros vivem no endereço (URL). Assim podes partilhar a ligação e o botão "voltar" funciona.
// Exemplo: ?tab=xbox&plataforma=pc&categoria=RPG&promo=1&aluguer=1&ordem=nome&layout=lista
// A barra de filtros (CatalogToolbar) muda estes parâmetros; esta página lê-os e pede à base de dados os produtos certos.

import type { Metadata } from "next";
import { getCategories, getProducts, HOME_TABS, type HomeTab, type ProductFilters } from "@/server/data";
import { CategoryTabs } from "@/components/shop/category-tabs";
import { CatalogToolbar } from "@/components/shop/catalog-toolbar";
import { CatalogList } from "@/components/shop/catalog-list";
import { Container, PageTitle } from "@/components/layout/page-title";

export const metadata: Metadata = { title: "Jogos" };
// A página é refeita a CADA pedido (os dados mudam: stock, preços, eventos), em vez de ficar guardada desde o build.
export const dynamic = "force-dynamic";

// Os parâmetros do endereço: nomes de texto que podem ter um valor de texto (ou não existir).
type Params = Record<string, string | undefined>;

export default async function JogosPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  // Separador ativo: se o valor não for um dos conhecidos, usa "popular".
  const tab = (HOME_TABS.some((t) => t.id === sp.tab) ? sp.tab : "popular") as HomeTab;

  // Pede à base de dados os jogos (já filtrados) e a lista de categorias, ao mesmo tempo.
  const [products, categories] = await Promise.all([
    getProducts({
      type: "jogo",
      tab,
      platform: sp.plataforma,
      category: sp.categoria,
      onSale: sp.promo === "1",
      rentable: sp.aluguer === "1",
      // Se a pessoa escolheu uma ordem, usa-a. Senão: no separador "novos" ordena por novidades, nos outros por popularidade.
      sort: (sp.ordem as ProductFilters["sort"]) ?? (tab === "novos" ? "novidades" : "popular"),
    }),
    getCategories("jogo"),
  ]);

  // Cria a ligação de cada separador: mantém todos os outros filtros e só troca o `tab`.
  const hrefFor = (id: string) => {
    // Copia os filtros atuais (menos o "tab" e os vazios).
    const next = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== "tab") as [string, string][]);
    // O "popular" é o separador por omissão, por isso não precisa de aparecer no endereço.
    if (id !== "popular") next.set("tab", id);
    const qs = next.toString();
    return qs ? `/jogos?${qs}` : "/jogos";
  };

  return (
    <Container className="space-y-6 pb-6">
      <PageTitle className="pb-2">Jogos</PageTitle>
      <CategoryTabs tabs={HOME_TABS} active={tab} hrefFor={hrefFor} />
      <div className="pt-6">
        {/* A barra com os filtros (categoria, plataforma, promoções, aluguer, ordem e layout). */}
        <CatalogToolbar
          categories={categories}
          showRentFilter
          platforms={[
            { id: "playstation", label: "PlayStation" },
            { id: "xbox", label: "Xbox" },
            { id: "nintendo", label: "Nintendo" },
            { id: "pc", label: "PC" },
            { id: "tabuleiro", label: "Tabuleiro" },
          ]}
        />
      </div>
      {/* Mostra os jogos em lista ou em grelha, conforme o `layout` do endereço. */}
      <CatalogList products={products} layout={sp.layout === "lista" ? "lista" : "grelha"} />
    </Container>
  );
}
