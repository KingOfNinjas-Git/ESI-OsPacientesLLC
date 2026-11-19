// FICHEIRO: carrinho/pagamento/page.tsx
// Passo 3 da compra: o Pagamento ( /carrinho/pagamento ). Exige sessão. O pagamento é só uma simulação.

import type { Metadata } from "next";
import { PaymentForm } from "@/components/cart/payment-form";
import { Container } from "@/components/layout/page-title";

export const metadata: Metadata = { title: "Pagamento" };

export default function PagamentoPage() {
  return (
    <Container className="py-6">
      <PaymentForm />
    </Container>
  );
}
