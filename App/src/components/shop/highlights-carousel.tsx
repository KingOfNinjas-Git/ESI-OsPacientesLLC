// FICHEIRO: highlights-carousel.tsx
// O carrossel "Destaques" da página inicial: mostra um slide de cada vez, com setas,
// bolinhas indicadoras e avanço automático a cada 6 segundos (pára se puseres o rato por cima).
// À direita de cada slide aparece o planeta em "wireframe" (ver components/animations/planet.tsx).
//
// Animações (biblioteca motion):
//   - os slides fazem uma transição suave (crossfade);
//   - o texto entra em cascata, linha a linha, com um ligeiro desfoque;
//   - o planeta e o texto mexem-se a velocidades diferentes quando desces a página (parallax);
//   - o indicador do slide atual vai enchendo ao longo dos 6 segundos até ao próximo.
//
// "use client": corre no browser, porque tem estado (qual é o slide atual) e um temporizador.

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion, useScroll, useTransform, type Variants } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Planet, Sparkle } from "@/components/animations/planet";

// Um Link do Next.js que também sabe ser animado pela biblioteca motion.
const MotionLink = motion.create(Link);

// A animação do texto do slide: cada linha entra em cascata (sobe, aparece e perde o desfoque).
//  - textGroup controla o "atraso" entre as linhas
//  - textLine descreve como cada linha entra ("in") e sai ("out")
const textGroup: Variants = {
  out: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
  in: { transition: { staggerChildren: 0.09, delayChildren: 0.2 } },
};
const textLine: Variants = {
  out: { opacity: 0, y: 14, filter: "blur(6px)" },
  in: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

// Os dados de um slide (os slides são montados em app/(loja)/page.tsx).
export interface Highlight {
  title: string;
  subtitle: string;
  cta: string; // texto do botão
  href: string; // para onde o botão leva
  color: string;
  eyebrow: string; // a palavrinha em cima do título (ex.: "Evento")
  // Informação curta ao lado do tipo (data do evento, desconto...).
  meta?: string;
}

// O carrossel completo: setas dos lados e bolinhas indicadoras em baixo.
export function HighlightsCarousel({ slides }: { slides: Highlight[] }) {
  // `index` é o slide visível agora; `paused` diz se o rato está por cima (e o avanço automático pára).
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // Parallax: ao descer a página, o planeta desce mais devagar e o texto sobe um bocadinho.
  const { scrollY } = useScroll();
  const planetY = useTransform(scrollY, [0, 400], [0, 70]);
  const textY = useTransform(scrollY, [0, 400], [0, -24]);
  // Vai para o slide `i`. Se passar do fim, volta ao início (e vice-versa). O % faz esse "dar a volta".
  const go = useCallback((i: number) => setIndex((i + slides.length) % slides.length), [slides.length]);

  // Avanço automático: de 6 em 6 segundos passa ao slide seguinte.
  // É cancelado e reiniciado sempre que `paused` muda (por isso pára com o rato por cima).
  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  // Sem slides, não desenha nada.
  if (!slides.length) return null;

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Destaques"
      className="relative h-[319px] overflow-hidden bg-brand-950 text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* O título pequenino "Destaques" no topo. */}
      <p className="absolute top-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 font-display text-[13px] font-medium text-brand-300">
        <Sparkle className="size-2 text-spark" />
        Destaques
        <Sparkle className="size-2 text-spark" />
      </p>

      {/* Todos os slides ficam empilhados uns em cima dos outros; só o atual tem opacidade 1 (visível). */}
      {slides.map((s, i) => (
        <motion.div
          key={s.title}
          aria-hidden={i !== index}
          // data-active liga a animação de desenhar o planeta (o CSS está em styles/animations.css).
          data-active={i === index}
          className={cn("absolute inset-0", i !== index && "pointer-events-none")}
          initial={false}
          animate={{ opacity: i === index ? 1 : 0 }}
          transition={{ duration: 0.9 }}
          style={{ background: `radial-gradient(ellipse at 80% 50%, color-mix(in oklab, ${s.color} 55%, #250663) 0%, #18063a 62%)` }}
        >
          {/* Fundo com estrelinhas. */}
          <div aria-hidden className="starfield pointer-events-none absolute inset-0" />
          {/* O planeta à direita (escondido em ecrãs pequenos). */}
          <motion.div style={{ y: planetY }} className="absolute top-1/2 right-[8%] hidden size-56 -translate-y-1/2 md:block">
            <motion.div
              className="size-full"
              initial={false}
              animate={i === index ? { scale: 1, x: 0, rotate: 0 } : { scale: 0.88, x: 48, rotate: -8 }}
              transition={{ duration: 1.1 }}
            >
              <Planet color={s.color} id={String(i)} className="size-full" />
            </motion.div>
          </motion.div>
          {/* O texto do slide: tipo, título, subtítulo e botão. */}
          <motion.div
            style={{ y: textY }}
            className="mx-auto flex h-full max-w-6xl flex-col justify-center px-14 sm:px-20"
            variants={textGroup}
            initial={false}
            animate={i === index ? "in" : "out"}
          >
            <motion.p variants={textLine} className="flex items-center gap-2 font-display text-sm font-semibold text-spark">
              <Sparkle className="size-2.5" />
              {s.eyebrow}
              {s.meta && <span className="font-medium text-white/70">{s.meta}</span>}
            </motion.p>
            <motion.h2 variants={textLine} className="mt-2 max-w-lg font-display text-3xl leading-[1.05] font-bold sm:text-[2.75rem]">
              {s.title}
            </motion.h2>
            <motion.p variants={textLine} className="mt-3 max-w-md leading-relaxed text-white/80">
              {s.subtitle}
            </motion.p>
            <MotionLink
              variants={textLine}
              href={s.href}
              tabIndex={i === index ? 0 : -1}
              className="chamfer mt-6 w-fit px-5 py-2 font-display text-sm font-bold text-brand-950 [--ch-fill:var(--spark)] [--cut:9px] hover:[--ch-fill:#ffdc85] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white"
            >
              {s.cta}
            </MotionLink>
          </motion.div>
        </motion.div>
      ))}

      {/* Seta da esquerda (slide anterior). */}
      <button onClick={() => go(index - 1)} aria-label="Destaque anterior" className="chamfer absolute top-1/2 left-3 z-10 -translate-y-1/2 p-2 text-brand-300 [--ch-line:rgb(185_164_255/0.3)] [--ch-fill:rgb(24_6_58/0.6)] [--cut:7px] hover:text-spark hover:[--ch-line:var(--spark)] focus-visible:outline-2 focus-visible:outline-spark">
        <ArrowLeft className="size-5" />
      </button>
      {/* Seta da direita (slide seguinte). */}
      <button onClick={() => go(index + 1)} aria-label="Destaque seguinte" className="chamfer absolute top-1/2 right-3 z-10 -translate-y-1/2 p-2 text-brand-300 [--ch-line:rgb(185_164_255/0.3)] [--ch-fill:rgb(24_6_58/0.6)] [--cut:7px] hover:text-spark hover:[--ch-line:var(--spark)] focus-visible:outline-2 focus-visible:outline-spark">
        <ArrowRight className="size-5" />
      </button>

      {/* As bolinhas indicadoras em baixo: uma por slide, e dá para clicar para saltar para esse slide. */}
      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {slides.map((s, i) => (
          <button
            key={s.title}
            onClick={() => go(i)}
            aria-label={`Ir para destaque ${i + 1}`}
            aria-current={i === index}
            // O indicador do slide atual alonga-se numa "pílula" que se enche até ao próximo slide.
            className={cn(
              "relative h-[15px] overflow-hidden rounded-full border transition-[width,background-color,border-color] duration-500 ease-[var(--ease-apple)]",
              i === index ? "w-10 border-spark/70 bg-white/10" : "w-[15px] border-brand-300/70 bg-transparent hover:bg-brand-300/30",
            )}
          >
            {i === index && slides.length > 1 && (
              <motion.span
                // A `key` reinicia a barra a cada slide e quando se tira o rato de cima (o temporizador também reinicia).
                key={`${index}-${paused}`}
                className="absolute inset-y-0 left-0 bg-spark"
                initial={{ width: paused ? "100%" : "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: paused ? 0 : 6, ease: "linear" }}
              />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
