// FICHEIRO: catalog-list.tsx
// Mostra os produtos em grelha ("Layout 1") ou em lista ("Layout 2"),
// conforme o `?layout=` que estiver no endereço. Usado em /jogos e /merch.

import { ProductGrid, ProductRow } from "./product-card";
import type { Product } from "@/lib/types";

export function CatalogList({ products, layout }: { products: Product[]; layout: "grelha" | "lista" }) {
  // Modo lista (e só se houver produtos): uma linha por produto.
  if (layout === "lista" && products.length) {
    return (
      <div className="space-y-3">
        {products.map((p) => (
          <ProductRow key={p.id} product={p} />
        ))}
      </div>
    );
  }
  // Em qualquer outro caso (modo grelha, ou sem produtos), usa a grelha.
  return <ProductGrid products={products} />;
}
