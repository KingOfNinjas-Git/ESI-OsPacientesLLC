// FICHEIRO: staff/ui.tsx
// Peças visuais simples partilhadas por /trabalhador, /admin e /conta:
// classes para campos e botões, uma caixa com título, um cartão de estatística,
// a etiqueta do estado da encomenda e um campo com título.

import { cn } from "@/lib/utils";

// Aspeto de um campo pequeno dentro de tabelas (stock, preço...).
export const cellInput =
  "h-8 w-20 rounded border border-white/20 bg-card px-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none";
// Aspeto de um campo normal de formulário.
export const fieldInput =
  "h-9 w-full rounded-md border border-white/20 bg-card px-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none";
// Aspeto do botão principal pequeno ("Guardar").
export const smallBtn = "h-8 rounded bg-brand-500 px-3 text-xs font-medium text-white hover:brightness-110";
// Aspeto do botão de ação perigosa ("Remover"): vermelho.
export const dangerBtn = "h-8 rounded border border-destructive/40 px-3 text-xs text-destructive hover:bg-destructive/10";

// Uma caixa com título e, se quiseres, botões no canto (`actions`).
export function Panel({ title, children, className, actions }: { title: string; children: React.ReactNode; className?: string; actions?: React.ReactNode }) {
  return (
    <section className={cn("rounded-md bg-card p-5 shadow-sm ring-1 ring-white/10", className)}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-medium text-foreground">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

// Um cartão escuro com um número grande (as estatísticas da Administração).
// O `hint` é uma frase pequenina de apoio por baixo (opcional).
export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md bg-brand-950 p-5 text-white">
      <p className="text-xs tracking-wide text-white/70 uppercase">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-white/60">{hint}</p>}
    </div>
  );
}

// A etiqueta colorida do estado de uma encomenda: pago (verde), pendente (amarelo) ou cancelado (cinzento).
export function StatusBadge({ status }: { status: string }) {
  const cls = status === "pago" ? "bg-emerald-100 text-emerald-800" : status === "pendente" ? "bg-amber-100 text-amber-800" : "bg-zinc-200 text-zinc-700";
  return <span className={cn("rounded px-2 py-0.5 text-xs font-medium capitalize", cls)}>{status}</span>;
}

// Um título pequeno com um campo por baixo (o campo vai dentro, em `children`).
export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}
