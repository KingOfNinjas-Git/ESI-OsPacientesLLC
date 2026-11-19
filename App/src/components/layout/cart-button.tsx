// FICHEIRO: cart-button.tsx
// O ícone do carrinho no cabeçalho, com o número de artigos que lá estão.
//
// "use client": corre no browser, porque o número vem do carrinho guardado no localStorage.

"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCart } from "@/components/cart/cart-provider";

export function CartButton() {
  // `count` é o total de unidades no carrinho.
  const { count } = useCart();
  return (
    <Link href="/carrinho" className="relative flex flex-col items-center gap-1 font-display text-xs font-medium text-white/85 transition hover:text-spark">
      <span>Cart</span>
      <span className="relative">
        <ShoppingCart className="size-7" strokeWidth={1.5} />
        {/* A bolinha com o número: "salta" (efeito de mola) sempre que o número muda,
            e aparece/desaparece a crescer/encolher. Só existe se houver pelo menos 1 artigo. */}
        <AnimatePresence>
          {count > 0 && (
            <motion.span
              key={count}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
              className="absolute -top-2 -right-3 grid min-w-5 place-items-center rounded-full bg-spark px-1 font-display text-[11px] leading-5 font-bold text-brand-950 ring-2 ring-brand-950"
            >
              {count}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      {/* Texto escondido, só para leitores de ecrã (pessoas que não veem o ecrã). */}
      <span className="sr-only">{count} artigos no carrinho</span>
    </Link>
  );
}
