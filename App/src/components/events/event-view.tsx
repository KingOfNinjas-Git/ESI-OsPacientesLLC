// FICHEIRO: event-view.tsx
// A página de um evento (usada em /eventos e em /eventos/<slug>). Tem estas partes, de cima para baixo:
//   1. o título "Eventos" e botões para os outros eventos
//   2. o bloco de destaque com nome, data, descrição, "Comprar bilhete" e "Ver programa"
//   3. a Informação do evento (data, horário, local, lotação, idade, duração)
//   4. os Bilhetes (um cartão por tipo, com botão de compra)
//   5. a Informação dos organizadores

import Link from "next/link";
import { CalendarDays, Clock, Hourglass, MapPin, ShieldCheck, Users } from "lucide-react";
import { Container, PageTitle } from "@/components/layout/page-title";
import { formatDate, formatEuro, formatTime } from "@/lib/format";
import type { GameEvent, GameEventWithTickets } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TicketButton } from "./ticket-button";
import { ProgramDialog } from "./program-dialog";
import { Sparkle } from "@/components/animations/planet";

// Uma caixinha com ícone (opcional), título pequeno e valor. Usada nas secções de informação.
function InfoBox({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div className="flex min-h-[112px] flex-col justify-end gap-1 border border-white/10 bg-card p-4">
      {Icon && <Icon className="mb-auto size-5 text-brand-300" strokeWidth={1.6} />}
      <span className="font-display text-xs font-semibold text-muted-foreground">{label}</span>
      <span className="text-[17px] leading-snug font-medium text-foreground">{value}</span>
    </div>
  );
}

// O título de uma secção. O `id` permite saltar diretamente para ali (o botão "Comprar bilhete" leva a #bilhetes).
function SectionTitle({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="scroll-mt-6 font-display text-xl font-bold text-foreground">
      {children}
    </h2>
  );
}

// A página completa de um evento (Figma "Eventos").
//  - event:  o evento a mostrar (com os seus bilhetes)
//  - others: todos os eventos, para os botões de navegação no topo
export function EventView({ event, others }: { event: GameEventWithTickets; others: GameEvent[] }) {
  // Datas de início e fim como objetos Date.
  const start = new Date(event.starts_at);
  const end = new Date(event.ends_at);
  // Duração em horas (a diferença entre o fim e o início, em milissegundos, dividida por 36e5 = horas).
  // Se for 24 horas ou mais, passa a contar em dias.
  const hours = Math.round((end.getTime() - start.getTime()) / 36e5);
  const duration = hours >= 24 ? `${Math.ceil(hours / 24)} dias` : `${hours} horas`;
  // Bilhetes ainda disponíveis: soma do stock de todos os tipos.
  const remaining = event.tickets.reduce((s, t) => s + Math.max(t.stock, 0), 0);

  // A lista das 6 caixinhas de informação do evento.
  const info = [
    { label: "Data", value: formatDate(start), icon: CalendarDays },
    { label: "Horário", value: `${formatTime(start)} – ${formatTime(end)}`, icon: Clock },
    { label: "Local", value: event.location, icon: MapPin },
    { label: "Lotação", value: `${event.capacity} pessoas · ${remaining} bilhetes disponíveis`, icon: Users },
    { label: "Idade mínima", value: event.min_age ? `${event.min_age}+ anos` : "Todas as idades", icon: ShieldCheck },
    { label: "Duração", value: duration, icon: Hourglass },
  ];

  return (
    <>
      <PageTitle>Eventos</PageTitle>

      {/* Se houver mais do que um evento, mostra botões para saltar entre eles. O evento atual fica destacado. */}
      {others.length > 1 && (
        <Container className="-mt-2 mb-4 flex flex-wrap justify-center gap-2">
          {others.map((e) => (
            <Link
              key={e.id}
              href={`/eventos/${e.slug}`}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition",
                e.id === event.id ? "border-brand-500 bg-brand-700 text-white" : "border-white/15 bg-card text-foreground hover:border-brand-500",
              )}
            >
              <span className="font-display font-semibold">{e.name}</span>
              <span className={e.id === event.id ? "text-brand-300" : "text-muted-foreground"}>{formatDate(e.starts_at)}</span>
            </Link>
          ))}
        </Container>
      )}

      {/* O bloco grande de destaque do evento (no Figma tem 853×492). */}
      <section
        className="relative flex min-h-[420px] flex-col items-center overflow-hidden px-4 pt-5 pb-0 text-white sm:min-h-[492px]"
        style={{ background: `radial-gradient(ellipse at 50% 45%, color-mix(in oklab, ${event.color} 55%, #250663) 0%, #18063a 70%)` }}
      >
        <div aria-hidden className="starfield pointer-events-none absolute inset-0" />
        <p className="relative flex items-center gap-2 font-display text-[15px] font-semibold text-spark">
          <Sparkle className="size-2.5" />
          {event.featured ? "Em destaque" : "Brevemente"}
        </p>
        {/* O texto central: data, nome, frase e descrição. */}
        <div className="relative my-auto flex max-w-2xl flex-col items-center text-center">
          <p className="font-display text-base font-medium text-brand-300">{formatDate(start)}, {formatTime(start)}</p>
          <h2 className="mt-2 font-display text-4xl leading-none font-bold sm:text-6xl">{event.name}</h2>
          <p className="mt-3 text-lg text-white/85">{event.tagline}</p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70">{event.description}</p>
        </div>
        {/* Os dois botões: "Comprar bilhete" (salta para os bilhetes) e "Ver programa" (abre a janela do programa). */}
        <div className="relative flex w-full max-w-md justify-center gap-6 pb-0 sm:ml-auto sm:mr-[8%] sm:justify-end">
          <a href="#bilhetes" className="flex h-[54px] w-40 items-center justify-center bg-spark font-display text-[15px] font-bold text-brand-950 transition [clip-path:polygon(12px_0,100%_0,100%_100%,0_100%,0_12px)] hover:bg-[#ffdc85] focus-visible:bg-white focus-visible:outline-none">
            Comprar bilhete
          </a>
          <ProgramDialog
            name={event.name}
            program={event.program}
            className="flex h-[54px] w-40 items-center justify-center bg-white/10 font-display text-[15px] font-semibold text-white transition [clip-path:polygon(12px_0,100%_0,100%_100%,0_100%,0_12px)] hover:bg-white/20 hover:text-spark focus-visible:bg-white/25 focus-visible:outline-none"
          />
        </div>
      </section>

      <Container className="space-y-6 py-10">
        {/* Secção 1: informação do evento. */}
        <SectionTitle>Informação Evento</SectionTitle>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 md:gap-11">
          {info.map((i) => (
            <InfoBox key={i.label} {...i} />
          ))}
        </div>

        {/* Secção 2: bilhetes. Um cartão para cada tipo de bilhete. */}
        <div className="pt-8">
          <SectionTitle id="bilhetes">Bilhetes</SectionTitle>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 md:gap-11">
          {event.tickets.map((t) => (
            <div key={t.id} className="flex min-h-[112px] flex-col gap-2 border border-white/10 bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="font-display font-semibold text-foreground">{t.name}</span>
                <span className="font-display text-lg leading-none font-bold text-foreground">{formatEuro(t.price_cents)}</span>
              </div>
              {/* Descrição e disponibilidade: "X disponíveis" ou "Esgotado" (a vermelho). */}
              <span className="text-xs text-muted-foreground">
                {t.description}
                <span className={cn("ml-2 font-semibold", t.stock > 0 ? "text-brand-300" : "text-destructive")}>{t.stock > 0 ? `${t.stock} disponíveis` : "Esgotado"}</span>
              </span>
              <div className="mt-auto border-t border-dashed border-brand-300 pt-3">
                <TicketButton ticket={t} eventName={event.name} eventDate={start.toISOString()} color={event.color} />
              </div>
            </div>
          ))}
        </div>

        {/* Secção 3: informação dos organizadores. */}
        <div className="pt-4">
          <SectionTitle>Informação Organizadores</SectionTitle>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 md:gap-11">
          {event.organizers.map((o) => (
            <InfoBox key={o.label} label={o.label} value={o.value} />
          ))}
        </div>
      </Container>
    </>
  );
}
