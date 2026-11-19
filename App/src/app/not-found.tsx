// FICHEIRO: not-found.tsx
// A página de erro 404 ("não encontrado").
// Aparece quando o endereço não existe, ou quando uma página chama `notFound()`.

import Link from "next/link";
import { Container, PageTitle } from "@/components/layout/page-title";

export default function NotFound() {
  return (
    <Container className="pb-24 text-center">
      <PageTitle>Página não encontrada</PageTitle>
      <p className="text-muted-foreground">Este nível ainda não foi desbloqueado.</p>
      {/* Botão para a pessoa não ficar perdida: leva de volta à página inicial. */}
      <Link href="/" className="mt-6 inline-block rounded-md bg-brand-500 px-4 py-2 text-sm text-white hover:brightness-110">
        Voltar à página inicial
      </Link>
    </Container>
  );
}
