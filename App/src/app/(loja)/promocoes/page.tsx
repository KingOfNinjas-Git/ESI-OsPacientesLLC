// FICHEIRO: promocoes/page.tsx
// A página das Promoções ( /promocoes ): mostra todos os artigos com desconto,
// com a etiqueta "-X%" no canto de cada cartão, e os dois blocos de destaque no fim.

import type { Metadata } from "next";
import { getProducts } from "@/server/data";
import { ProductGrid } from "@/components/shop/product-card";
import { PromoBanners } from "@/components/shop/promo-banners";
import { Container, PageTitle } from "@/components/layout/page-title";

export const metadata: Metadata = { title: "Promoções" };
// A página é refeita a CADA pedido (os dados mudam: stock, preços, eventos), em vez de ficar guardada desde o build.
export const dynamic = "force-dynamic";

export default async function PromocoesPage() {
  // Só os artigos com desconto, os mais populares primeiro.
  const products = await getProducts({ onSale: true, sort: "popular" });
  return (
    <Container className="space-y-8 pb-6">
      <PageTitle>Promoções</PageTitle>
      <ProductGrid products={products} showDiscountTag />
      <PromoBanners />
    </Container>
  );
}
