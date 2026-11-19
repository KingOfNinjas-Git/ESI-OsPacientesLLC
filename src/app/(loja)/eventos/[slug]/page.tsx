// FICHEIRO: eventos/[slug]/page.tsx
// A página de um evento específico ( /eventos/<slug> ).
// Usa o mesmo componente que /eventos (o EventView); só muda qual é o evento mostrado.
// O [slug] no nome da pasta quer dizer "esta parte do endereço muda de evento para evento".

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEventBySlug, getEvents } from "@/server/data";
import { EventView } from "@/components/events/event-view";

// A página é refeita a CADA pedido (os dados mudam: stock, preços, eventos), em vez de ficar guardada desde o build.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

// Define o título do separador do browser: o nome do evento.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getEventBySlug((await params).slug);
  return { title: event?.name ?? "Evento" };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  // Procura o evento pedido e a lista de todos (para os botões "outros eventos").
  const [event, events] = await Promise.all([getEventBySlug(slug), getEvents()]);
  // Se o evento não existe, mostra a página 404.
  if (!event) notFound();
  return <EventView event={event} others={events} />;
}
