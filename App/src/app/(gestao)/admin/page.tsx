// FICHEIRO: admin/page.tsx
// A página de Administração ( /admin ) — só para administradores.
//
// Mostra:
//   - estatísticas (receita, utilizadores, bilhetes, stock baixo, receita por tipo e por mês, mais vendidos)
//   - a gestão de utilizadores (mudar o papel, remover)
//   - as últimas encomendas
// Para gerir stock e eventos, o administrador usa a Área do trabalhador (também tem acesso a ela).
//
// As estatísticas ignoram encomendas canceladas; a "receita paga" só conta as encomendas pagas.

import type { Metadata } from "next";
import { requireRole } from "@/server/session";
import { query } from "@/server/db";
import { formatDate, formatEuro } from "@/lib/format";
import { Container, PageTitle } from "@/components/layout/page-title";
import { dangerBtn, Panel, smallBtn, Stat } from "@/components/staff/ui";
import { OrdersTable } from "@/components/staff/orders-table";
import { deleteUserAction, updateUserRoleAction } from "@/server/actions/staff";

export const metadata: Metadata = { title: "Administração" };
// A página é refeita a CADA pedido (os dados mudam: stock, preços, eventos), em vez de ficar guardada desde o build.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Só deixa passar administradores. Os outros são mandados embora. Guardamos os dados do admin que está a ver a página.
  const admin = await requireRole("administrador");

  // Faz TODAS as consultas à base de dados ao mesmo tempo (em paralelo), para a página carregar depressa.
  // Pela ordem, são: utilizadores, totais gerais, receita por tipo de item, top 5 mais vendidos,
  // stock baixo, últimas 15 encomendas e receita paga dos últimos 6 meses.
  const [users, [totals], byKind, top, lowStock, orders, monthly] = await Promise.all([
    query<{ id: number; email: string; first_name: string; last_name: string; role: string; created_at: Date }>(
      "SELECT id, email, first_name, last_name, role, created_at FROM users ORDER BY created_at DESC",
    ),
    query<{ orders: number; revenue: number | null; pending: number; tickets: number | null }>(
      `SELECT COUNT(*) AS orders,
              SUM(CASE WHEN status = 'pago' THEN total_cents END) AS revenue,
              SUM(status = 'pendente') AS pending,
              (SELECT SUM(oi.quantity) FROM order_items oi JOIN orders o2 ON o2.id = oi.order_id WHERE oi.kind = 'bilhete' AND o2.status <> 'cancelado') AS tickets
       FROM orders`,
    ),
    query<{ kind: string; units: number; revenue: number }>(
      `SELECT oi.kind, SUM(oi.quantity) AS units, SUM(oi.quantity * oi.unit_price_cents) AS revenue
       FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.status <> 'cancelado' GROUP BY oi.kind`,
    ),
    query<{ name: string; units: number }>(
      `SELECT oi.name, SUM(oi.quantity) AS units FROM order_items oi JOIN orders o ON o.id = oi.order_id
       WHERE o.status <> 'cancelado' GROUP BY oi.name ORDER BY units DESC LIMIT 5`,
    ),
    query<{ name: string; stock: number }>("SELECT name, stock FROM products WHERE stock <= 3 ORDER BY stock, name"),
    query<{ id: number; contact_name: string; status: string; total_cents: number; created_at: Date; payment_method: string }>(
      "SELECT * FROM orders ORDER BY created_at DESC LIMIT 15",
    ),
    query<{ month: string; revenue: number }>(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, SUM(total_cents) AS revenue FROM orders
       WHERE status = 'pago' GROUP BY month ORDER BY month DESC LIMIT 6`,
    ),
  ]);

  // Nomes bonitos para cada tipo de item.
  const kindLabel: Record<string, string> = { compra: "Vendas", aluguer: "Alugueres", bilhete: "Bilhetes" };
  // Conta quantos utilizadores têm um dado papel.
  const roleCount = (r: string) => users.filter((u) => u.role === r).length;
  // O valor mais alto de receita, para desenhar as barras na proporção certa (a maior ocupa 100%).
  // O `1` evita dividir por zero quando ainda não há vendas.
  const maxKind = Math.max(1, ...byKind.map((k) => Number(k.revenue)));

  return (
    <Container className="space-y-6 pb-10">
      <PageTitle>Administração</PageTitle>

      {/* Os 4 quadradinhos com os números principais. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Receita paga" value={formatEuro(Number(totals.revenue ?? 0))} hint={`${totals.orders} encomendas · ${totals.pending ?? 0} pendentes`} />
        <Stat label="Utilizadores" value={String(users.length)} hint={`${roleCount("cliente")} clientes · ${roleCount("trabalhador")} trabalhadores · ${roleCount("administrador")} admins`} />
        <Stat label="Bilhetes vendidos" value={String(totals.tickets ?? 0)} />
        <Stat label="Stock baixo" value={String(lowStock.length)} hint={lowStock.slice(0, 3).map((p) => p.name).join(", ") || "Tudo em ordem"} />
      </div>

      {/* Três caixas lado a lado: receita por tipo, mais vendidos e receita por mês. */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Receita por tipo">
          {byKind.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem vendas ainda.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {byKind.map((k) => (
                <li key={k.kind}>
                  <div className="flex justify-between">
                    <span>{kindLabel[k.kind]}</span>
                    <span className="font-medium">{formatEuro(Number(k.revenue))}</span>
                  </div>
                  {/* A barra: o fundo cinzento é o 100% e a parte roxa é a fatia deste tipo. */}
                  <div className="mt-1 h-2 rounded bg-muted">
                    <div className="h-2 rounded bg-brand-500" style={{ width: `${(Number(k.revenue) / maxKind) * 100}%` }} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{k.units} unidades</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Mais vendidos">
          {top.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem vendas ainda.</p>
          ) : (
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {top.map((t) => (
                <li key={t.name}>
                  {t.name} <span className="text-muted-foreground">· {t.units}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
        <Panel title="Receita por mês">
          {monthly.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem pagamentos ainda.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {monthly.map((m) => (
                <li key={m.month} className="flex justify-between">
                  <span>{m.month}</span>
                  <span className="font-medium">{formatEuro(Number(m.revenue))}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Tabela de utilizadores: dá para mudar o papel de cada um ou removê-lo. */}
      <Panel title="Utilizadores">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="py-2">Nome</th>
                <th>Email</th>
                <th>Desde</th>
                <th>Papel</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {/* Uma linha por utilizador. */}
              {users.map((u) => {
                // O administrador não pode mudar o próprio papel nem apagar a própria conta ("self" = é a própria pessoa).
                const self = String(u.id) === admin.id;
                return (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-2">
                      {u.first_name} {u.last_name} {self && <span className="text-xs text-muted-foreground">(tu)</span>}
                    </td>
                    <td>{u.email}</td>
                    <td>{formatDate(u.created_at)}</td>
                    <td>
                      {/* Formulário para mudar o papel. O id do utilizador vai num campo escondido. */}
                      <form action={updateUserRoleAction} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={u.id} />
                        <select name="role" defaultValue={u.role} disabled={self} className="h-8 rounded border px-1 text-xs">
                          <option value="cliente">cliente</option>
                          <option value="trabalhador">trabalhador</option>
                          <option value="administrador">administrador</option>
                        </select>
                        {!self && <button className={smallBtn}>Guardar</button>}
                      </form>
                    </td>
                    <td className="text-right">
                      {/* O botão de remover só aparece para as contas dos outros. */}
                      {!self && (
                        <form action={deleteUserAction}>
                          <input type="hidden" name="id" value={u.id} />
                          <button className={dangerBtn}>Remover</button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Últimas encomendas">
        <OrdersTable orders={orders} />
      </Panel>
    </Container>
  );
}
