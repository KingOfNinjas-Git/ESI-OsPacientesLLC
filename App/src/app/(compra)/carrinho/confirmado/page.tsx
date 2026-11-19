// FICHEIRO: carrinho/confirmado/page.tsx
// A confirmação depois de pagar ( /carrinho/confirmado?id=123 ).
// Só mostra a encomenda se ela pertencer a quem tem a sessão iniciada (user_id = id da sessão).
// Caso contrário dá erro 404, para ninguém espreitar encomendas dos outros trocando o número no endereço.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { auth } from "@/server/auth";
import { query } from "@/server/db";
import { formatEuro } from "@/lib/format";
import { Container } from "@/components/layout/page-title";

export const metadata: Metadata = { title: "Encomenda confirmada" };

export default async function ConfirmadoPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  // Lê o número da encomenda que vem no endereço (?id=123).
  const { id } = await searchParams;
  const session = await auth();
  // Sem sessão ou sem id? Página não encontrada.
  if (!session?.user || !id) notFound();

  // Procura a encomenda, mas SÓ se pertencer a esta pessoa (é isto que a protege dos curiosos).
  const [order] = await query<{ id: number; status: string; total_cents: number; payment_method: string; payment_ref: string; contact_email: string }>(
    "SELECT * FROM orders WHERE id = ? AND user_id = ?",
    [Number(id), Number(session.user.id)],
  );
  if (!order) notFound();

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-lg space-y-4 rounded-md bg-card p-8 text-center shadow-sm ring-1 ring-white/10">
        <CheckCircle2 className="mx-auto size-12 text-brand-300" />
        {/* Se já está paga, parabéns; se está pendente (Multibanco), dizemos só que foi registada. */}
        <h1 className="text-2xl text-foreground">{order.status === "pago" ? "Pagamento confirmado!" : "Encomenda registada"}</h1>
        <p className="text-muted-foreground">
          Encomenda n.º {order.id} · {formatEuro(order.total_cents)}
        </p>
        {/* Multibanco: mostramos a referência para a pessoa pagar. Nos outros métodos, avisamos do email. */}
        {order.payment_method === "multibanco" ? (
          <div className="rounded-md bg-brand-500/20 p-4 text-sm text-foreground">
            <p className="font-medium">Paga por Multibanco com:</p>
            <p className="mt-1 font-mono">{order.payment_ref}</p>
            <p className="mt-1 text-xs">Valor: {formatEuro(order.total_cents)}</p>
          </div>
        ) : (
          <p className="text-sm">Enviámos a confirmação para {order.contact_email}.</p>
        )}
        <p className="text-xs text-muted-foreground">Ambiente de demonstração: o pagamento é simulado.</p>
        {/* Dois botões: ver as encomendas ou voltar à loja. */}
        <div className="flex justify-center gap-3 pt-2">
          <Link href="/conta" className="rounded-md bg-brand-500 px-4 py-2 text-sm text-white hover:brightness-110">
            Ver as minhas encomendas
          </Link>
          <Link href="/" className="rounded-md border px-4 py-2 text-sm hover:bg-muted">
            Voltar à loja
          </Link>
        </div>
      </div>
    </Container>
  );
}
