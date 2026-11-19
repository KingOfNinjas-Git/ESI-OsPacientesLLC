// FICHEIRO: motion/primitives.tsx
// Peças de animação reutilizáveis (biblioteca "motion"):
//
//   MotionProvider  liga a opção "reduzir movimento" do sistema a TODAS as animações
//   Reveal          o conteúdo aparece (sobe e fica visível) quando entra no ecrã
//   StaggerItem     cada item aparece com um atraso conforme a sua posição (grelhas em cascata)
//
// "use client": as animações correm no browser. Mas podem ser usadas dentro de páginas do servidor,
// por exemplo <Reveal><MeuComponenteDeServidor /></Reveal>.
// Nenhuma peça muda o tamanho ou a posição final do conteúdo: só a maneira como ele chega.

"use client";

import { MotionConfig, motion } from "motion/react";
import { cn } from "@/lib/utils";

// A "curva" das animações: começam rápidas e travam devagarinho no fim (a mesma do CSS: `--ease-apple`).
export const EASE = [0.22, 1, 0.36, 1] as const;

// Põe-se no topo da aplicação. Se a pessoa ativou "reduzir movimento" no sistema,
// os deslocamentos e escalas param e fica só o aparecer suave (fade).
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ ease: EASE }}>
      {children}
    </MotionConfig>
  );
}

// Faz o conteúdo aparecer quando entra no ecrã (só uma vez).
//  - delay: espera em segundos antes de começar
//  - y:     distância (em pixels) de onde o conteúdo sobe
export function Reveal({ children, delay = 0, y = 24, className }: { children: React.ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// O contentor de um grupo em cascata. É só uma caixa simples: quem anima é cada `StaggerItem`.
// (Antes era o contentor que mandava nos filhos, mas isso falhava quando os filhos mudavam depois
// de o contentor já ter animado: ao filtrar o catálogo, os cartões novos ficavam invisíveis.)
export function Stagger({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

// Um filho de um `Stagger`. Anima sozinho quando ele próprio entra no ecrã, por isso também funciona
// com cartões que aparecem mais tarde (filtros, pesquisa, mudar de separador).
//  - index:  a posição na grelha
//  - step:   atraso (em segundos) entre um item e o seguinte
//  - perRow: quantos itens há por linha. O atraso repete-se a cada `perRow` itens,
//            e assim cada linha entra da esquerda para a direita.
// Ocupa a altura toda da célula (`h-full`).
export function StaggerItem({ children, className, index = 0, step = 0.07, perRow = 4 }: { children: React.ReactNode; className?: string; index?: number; step?: number; perRow?: number }) {
  return (
    <motion.div
      className={cn("h-full", className)}
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px -6% 0px" }}
      transition={{ duration: 0.75, delay: (index % perRow) * step, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
