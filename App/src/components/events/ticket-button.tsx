// FICHEIRO: ticket-button.tsx
// O botão "Comprar bilhete" de um tipo de bilhete: junta 1 bilhete ao carrinho.
//
// "use client": corre no browser, porque usa o carrinho.

"use client";

import { useCart } from "@/components/cart/cart-provider";
import { formatDateTime } from "@/lib/format";
import type { TicketType } from "@/lib/types";

export function TicketButton({
  ticket,
  eventName,
  eventDate,
  color,
}: {
  ticket: TicketType;
  eventName: string;
  eventDate: string;
  color: string;
}) {
  const { add } = useCart();
  // Sem stock, o botão fica desativado e diz "Esgotado".
  const soldOut = ticket.stock <= 0;
  return (
    <button
      type="button"
      disabled={soldOut}
      // Ao clicar, adiciona 1 bilhete ao carrinho. O `key` é único por tipo de bilhete,
      // por isso clicar outra vez só aumenta a quantidade em vez de criar outra linha.
      onClick={() =>
        add({
          key: `bilhete-${ticket.id}`,
          kind: "bilhete",
          ticketTypeId: ticket.id,
          eventName,
          eventDate: formatDateTime(eventDate),
          name: ticket.name,
          unitCents: ticket.price_cents,
          quantity: 1,
          color,
        })
      }
      className="chamfer w-full px-3 py-2 font-display text-[15px] font-semibold text-white transition [--ch-fill:var(--brand-700)] [--cut:8px] hover:text-spark hover:[--ch-fill:var(--brand-500)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:[--ch-fill:var(--muted)]"
    >
      {soldOut ? "Esgotado" : "Comprar bilhete"}
    </button>
  );
}
