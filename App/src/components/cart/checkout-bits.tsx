// FICHEIRO: checkout-bits.tsx
// Pecinhas pequenas que se repetem nos três passos da compra (carrinho, dados e pagamento).

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CartItem } from "@/lib/types";

// A "linha de progresso" no topo: "1. Carrinho → 2. Dados → 3. Pagamento".
// `current` diz em que passo estás (1, 2 ou 3).
export function CheckoutSteps({ current }: { current: 1 | 2 | 3 }) {
  // A lista dos passos, cada um com o seu número, nome e destino.
  const steps = [
    { n: 1, label: "Carrinho", href: "/carrinho" },
    { n: 2, label: "Dados", href: "/carrinho/dados" },
    { n: 3, label: "Pagamento", href: "/carrinho/pagamento" },
  ];
  return (
    <ol className="flex flex-wrap items-center gap-3 text-[13px] text-foreground">
      {steps.map((s, i) => (
        <li key={s.n} className="flex items-center gap-3">
          {/* Põe uma setinha antes de todos os passos menos do primeiro. */}
          {i > 0 && <ArrowRight className="size-3.5" aria-hidden />}
          {/* Passos que já passaste são ligações (para poderes voltar atrás).
              O passo atual e os seguintes são só texto; o atual fica a negrito. */}
          {s.n < current ? (
            <Link href={s.href} className="hover:underline">
              {s.n}. {s.label}
            </Link>
          ) : (
            <span aria-current={s.n === current ? "step" : undefined} className={cn(s.n === current && "font-semibold text-foreground")}>
              {s.n}. {s.label}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

// Uma ligação "← Voltar..." para o topo dos passos.
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 text-[13px] text-foreground hover:underline">
      <ArrowLeft className="size-3.5" /> {children}
    </Link>
  );
}

// Uma etiqueta curta que diz que tipo de item é ("Jogo · Aluguer", "Merch · Compra"...).
export function itemEyebrow(item: CartItem) {
  if (item.kind === "aluguer") return "Jogo · Aluguer";
  if (item.kind === "bilhete") return "Evento · Bilhete";
  return item.productType === "merch" ? "Merch · Compra" : "Jogo · Compra";
}

// O título grande de cada passo da compra.
export function CheckoutHeading({ children }: { children: React.ReactNode }) {
  return <h1 className="text-[25px] text-foreground">{children}</h1>;
}

// As classes do botão principal (roxo) das páginas do carrinho.
// Guardadas numa variável para o mesmo estilo servir em vários botões.
export const primaryCta =
  "flex h-[43px] w-full items-center justify-center rounded-sm bg-brand-500 text-[13px] font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60";
