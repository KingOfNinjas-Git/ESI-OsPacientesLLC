// FICHEIRO: carrinho/dados/page.tsx
// Passo 2 da compra: "Os teus dados" ( /carrinho/dados ). Exige sessão (o middleware trata disso).
// Já vem preenchido com o nome e o email da conta. A morada só é pedida se houver merch no carrinho.

import type { Metadata } from "next";
import { auth } from "@/server/auth";
import { DetailsForm } from "@/components/cart/details-form";
import { Container } from "@/components/layout/page-title";

export const metadata: Metadata = { title: "Os teus dados" };

export default async function DadosPage() {
  // Descobre quem está com sessão iniciada, para preencher o formulário com os dados dessa pessoa.
  const session = await auth();
  return (
    <Container className="py-6">
      <DetailsForm defaultName={session?.user?.name ?? ""} defaultEmail={session?.user?.email ?? ""} />
    </Container>
  );
}
