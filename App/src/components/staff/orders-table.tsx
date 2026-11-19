// FICHEIRO: orders-table.tsx
// A tabela das últimas encomendas (usada em /trabalhador e /admin).
// Cada linha tem um mini-formulário para mudar o estado (pendente / pago / cancelado),
// por exemplo quando chega um pagamento por Multibanco.

import { updateOrderStatusAction } from "@/server/actions/staff";
import { formatDateTime, formatEuro } from "@/lib/format";
import { StatusBadge } from "./ui";

export function OrdersTable({ orders }: { orders: { id: number; contact_name: string; status: string; total_cents: number; created_at: Date; payment_method: string }[] }) {
  // Sem encomendas? Mostra só uma mensagem simples.
  if (!orders.length) return <p className="text-sm text-muted-foreground">Ainda não há encomendas.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-sm">
        <thead className="text-left text-xs text-muted-foreground">
          <tr className="border-b">
            <th className="py-2">N.º</th>
            <th>Cliente</th>
            <th>Data</th>
            <th>Total</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {/* Uma linha para cada encomenda. */}
          {orders.map((o) => (
            <tr key={o.id} className="border-b last:border-0">
              <td className="py-2">{o.id}</td>
              <td>{o.contact_name}</td>
              <td>{formatDateTime(o.created_at)}</td>
              <td>{formatEuro(o.total_cents)}</td>
              <td>
                {/* O mini-formulário: mostra o estado atual, uma lista para escolher outro e o botão OK para gravar.
                    O id da encomenda vai num campo escondido para a ação saber qual encomenda mudar. */}
                <form action={updateOrderStatusAction} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={o.id} />
                  <StatusBadge status={o.status} />
                  <select name="status" defaultValue={o.status} className="h-8 rounded border px-1 text-xs">
                    <option value="pendente">pendente</option>
                    <option value="pago">pago</option>
                    <option value="cancelado">cancelado</option>
                  </select>
                  <button className="h-8 rounded border px-2 text-xs hover:bg-muted">OK</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
