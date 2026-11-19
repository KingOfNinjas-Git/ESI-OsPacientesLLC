// FICHEIRO: carrinho/page.tsx
// Passo 1 da compra: o Carrinho ( /carrinho ). Não é preciso ter sessão iniciada.
// O caminho completo da compra é:
//   /carrinho → /carrinho/dados → /carrinho/pagamento → /carrinho/confirmado

import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { Container } from "@/components/layout/page-title";

export const metadata: Metadata = { title: "Carrinho" };

export default function CarrinhoPage() {
  return (
    <Container className="py-6">
      {/* Todo o conteúdo do carrinho está no componente CartView. Esta página só o coloca no sítio certo. */}
      <CartView />
    </Container>
  );
}
