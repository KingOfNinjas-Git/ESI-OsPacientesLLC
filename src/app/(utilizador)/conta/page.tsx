// FICHEIRO: conta/page.tsx
// A página "A minha conta" ( /conta ): mostra os dados da pessoa e o histórico de encomendas,
// com o estado (pendente/pago/cancelado), os artigos e a forma de pagamento.
// Qualquer papel com sessão iniciada pode abrir (`requireRole()` sem papéis só exige que haja sessão).

import type { Metadata } from "next";
import { requireRole } from "@/server/session";
import { query } from "@/server/db";
import { formatDateTime, formatEuro } from "@/lib/format";
import { Container, PageTitle } from "@/components/layout/page-title";
import { Panel, StatusBadge } from "@/components/staff/ui";

export const metadata: Metadata = { title: "A minha conta" };
// A página é refeita a CADA pedido (os dados mudam: stock, preços, eventos), em vez de ficar guardada desde o build.
export const dynamic = "force-dynamic";

// Dicionários para escrever bonito o que está na base de dados ("mbway" → "MB WAY", etc.).
const methodLabel: Record<string, string> = { mbway: "MB WAY", multibanco: "Multibanco", cartao: "Cartão" };
const kindLabel: Record<string, string> = { compra: "Compra", aluguer: "Aluguer", bilhete: "Bilhete" };

export default async function ContaPage() {
  // Garante que há sessão (senão manda para o login) e devolve os dados da pessoa.
  const user = await requireRole();
  // Vai buscar as encomendas DESTA pessoa, da mais recente para a mais antiga.
  const orders = await query<{ id: number; status: string; total_cents: number; payment_method: string; payment_ref: string; created_at: Date }>(
    "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
    [Number(user.id)],
  );
  // Vai buscar os artigos de todas as encomendas numa só consulta (mais rápido).
  // Depois, lá em baixo, separamos por encomenda. Se não há encomendas, nem vale a pena perguntar.
  const items = orders.length
    ? await query<{ order_id: number; kind: string; name: string; details: string; quantity: number; unit_price_cents: number }>(
        "SELECT * FROM order_items WHERE order_id IN (?)",
        [orders.map((o) => o.id)],
      )
    : [];

  return (
    <Container className="space-y-6 pb-10">
      <PageTitle>A minha conta</PageTitle>
      {/* Caixa 1: os dados da pessoa. */}
      <Panel title="Dados">
        <p className="text-sm">
          {user.name} · {user.email} · <span className="capitalize">{user.role}</span>
        </p>
      </Panel>
      {/* Caixa 2: as encomendas. */}
      <Panel title="As minhas encomendas">
        {/* Se não há encomendas, mostra uma mensagem; se há, mostra a lista. */}
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda não fizeste nenhuma encomenda.</p>
        ) : (
          <div className="space-y-4">
            {/* Para cada encomenda, desenha um cartão. */}
            {orders.map((o) => (
              <div key={o.id} className="rounded-md border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    Encomenda n.º {o.id} <span className="text-sm font-normal text-muted-foreground">· {formatDateTime(o.created_at)}</span>
                  </p>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={o.status} />
                    <span className="font-semibold">{formatEuro(o.total_cents)}</span>
                  </div>
                </div>
                {/* A lista de artigos desta encomenda: filtramos só os que lhe pertencem. */}
                <ul className="mt-2 space-y-1 text-sm">
                  {items
                    .filter((i) => i.order_id === o.id)
                    .map((i, n) => (
                      <li key={n}>
                        <span className="text-xs text-muted-foreground uppercase">{kindLabel[i.kind]}</span> · {i.name}
                        {i.details ? ` (${i.details})` : ""} · {i.quantity} × {formatEuro(i.unit_price_cents)}
                      </li>
                    ))}
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">
                  {methodLabel[o.payment_method]} · {o.payment_ref}
                </p>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </Container>
  );
}
