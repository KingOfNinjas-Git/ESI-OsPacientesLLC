// FICHEIRO: eventos/page.tsx
// A página dos Eventos ( /eventos ): mostra o evento em destaque (ou, se não houver, o próximo).
// Os outros eventos aparecem como botões que levam a /eventos/<slug>.

import type { Metadata } from "next";
import { getEvents, getFeaturedEvent } from "@/server/data";
import { EventView } from "@/components/events/event-view";
import { Container, PageTitle } from "@/components/layout/page-title";

export const metadata: Metadata = { title: "Eventos" };
// A página é refeita a CADA pedido (os dados mudam: stock, preços, eventos), em vez de ficar guardada desde o build.
export const dynamic = "force-dynamic";

export default async function EventosPage() {
  // Vai buscar o evento em destaque e a lista de todos os eventos ao mesmo tempo.
  const [event, events] = await Promise.all([getFeaturedEvent(), getEvents()]);
  // Não há nenhum evento? Mostra uma mensagem simpática.
  if (!event) {
    return (
      <Container>
        <PageTitle>Eventos</PageTitle>
        <p className="pb-16 text-center text-muted-foreground">De momento não há eventos agendados. Volta em breve!</p>
      </Container>
    );
  }
  // Há evento: mostra-o, e passa a lista dos outros para aparecerem como botões.
  return <EventView event={event} others={events} />;
}
