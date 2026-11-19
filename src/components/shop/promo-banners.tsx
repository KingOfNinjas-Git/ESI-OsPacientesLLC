// FICHEIRO: promo-banners.tsx
// Os dois blocos grandes de publicidade que aparecem na página inicial e nas Promoções.
// Para mudar o texto ou a ligação de um bloco, edita a lista `banners` aqui dentro.

import Link from "next/link";
import { Coffee, Wrench } from "lucide-react";
import { OrbitLines } from "@/components/animations/planet";
import { Stagger, StaggerItem } from "@/components/motion/primitives";

// Os dois blocos por baixo da grelha de jogos (no Figma são retângulos de 387×255).
export function PromoBanners() {
  // A lista dos blocos. Cada um tem ligação, ícone, textos e cores de fundo.
  const banners = [
    {
      href: "/jogos?aluguer=1",
      icon: Coffee,
      eyebrow: "Aluguer & bar",
      title: "Aluga um jogo e joga cá",
      text: "Levanta o jogo na loja, devolve quando quiseres. Ou fica connosco e joga no bar.",
      cta: "Ver jogos para alugar",
      bg: "from-brand-900 to-brand-950",
    },
    {
      href: "/info/contactos",
      icon: Wrench,
      eyebrow: "Consolas",
      title: "Compra, aluguer e reparação",
      text: "A tua consola deixou de funcionar? Traz à loja para um diagnóstico gratuito.",
      cta: "Falar connosco",
      bg: "from-brand-700 to-brand-900",
    },
  ];

  return (
    // Os dois blocos aparecem em cascata, lado a lado em ecrãs maiores.
    <Stagger className="grid gap-6 sm:grid-cols-2 sm:gap-8">
      {/* Desenha um bloco para cada entrada da lista. */}
      {banners.map((b, i) => (
        <StaggerItem key={b.title} index={i} step={0.12} perRow={2}>
        <Link
          href={b.href}
          className={`group cut-tr relative isolate flex h-full min-h-[255px] flex-col justify-end overflow-hidden bg-gradient-to-br [--cut:28px] ${b.bg} p-6 text-white focus-visible:outline-none`}
        >
          {/* Decoração de fundo: estrelas, anéis de órbita e o ícone grande. */}
          <div aria-hidden className="starfield absolute inset-0 -z-10" />
          <OrbitLines className="absolute -right-10 -bottom-16 -z-10 h-[120%] text-brand-300/20 transition duration-700 ease-[var(--ease-apple)] group-hover:scale-105 group-hover:rotate-3 group-hover:text-brand-300/35" />
          <b.icon className="absolute top-8 right-10 -z-10 size-14 text-brand-300/25 transition-colors group-hover:text-spark sm:text-brand-300/50" strokeWidth={1.25} />
          {/* O texto do bloco. */}
          <p className="font-display text-sm font-semibold text-spark">{b.eyebrow}</p>
          <h3 className="mt-1 font-display text-[1.75rem] leading-tight font-bold">{b.title}</h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/80">{b.text}</p>
          <span className="chamfer mt-4 w-fit px-4 py-1.5 font-display text-sm font-semibold [--ch-line:rgb(185_164_255/0.55)] [--cut:7px] group-hover:text-brand-950 group-hover:[--ch-fill:var(--spark)] group-hover:[--ch-line:var(--spark)] group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-spark">{b.cta}</span>
        </Link>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
