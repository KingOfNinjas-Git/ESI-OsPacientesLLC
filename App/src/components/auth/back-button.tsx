// FICHEIRO: back-button.tsx
// O botão "Voltar": volta à página anterior ou, se não houver nenhuma anterior, vai para a página inicial.
// Usado no login e na página de produto.
//
// "use client": corre no browser, porque usa o histórico de navegação do browser.

"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      // Se o histórico tem mais do que uma página, volta atrás; senão vai para a página inicial.
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
      className="chamfer flex h-11 w-[86px] items-center justify-center gap-1 font-display text-[13px] font-semibold text-foreground [--ch-fill:rgb(255_255_255/0.06)] [--ch-line:rgb(185_164_255/0.28)] [--cut:8px] hover:[--ch-fill:rgb(255_255_255/0.12)] hover:[--ch-line:var(--brand-500)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
    >
      <ArrowLeft className="size-3.5" /> Voltar
    </button>
  );
}
