// FICHEIRO: program-dialog.tsx
// O botão "Ver programa" e a janelinha com o programa do evento.
// Cada linha do programa escrita no formato "19:00 — Texto" aparece com a hora à esquerda.
//
// "use client": corre no browser, porque abre e fecha a janelinha.

"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";

export function ProgramDialog({ name, program, className }: { name: string; program: string; className?: string }) {
  // Parte o programa em linhas e ignora as vazias.
  const lines = program.split("\n").filter(Boolean);
  return (
    <Dialog>
      {/* O botão que abre a janelinha. */}
      <DialogTrigger className={className}>Ver programa</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Programa · {name}</DialogTitle>
          <DialogDescription>Horários sujeitos a pequenos ajustes no dia.</DialogDescription>
        </DialogHeader>
        <ol className="space-y-3">
          {/* Para cada linha, separa a hora do texto (o separador é " — "). */}
          {lines.map((l) => {
            const [time, ...rest] = l.split(" — ");
            return (
              <li key={l} className="flex gap-4 border-b pb-3 last:border-0">
                {/* Se a linha não tem hora (não tem o " — "), deixa o espaço da hora vazio e mostra o texto todo. */}
                <span className="w-14 shrink-0 font-semibold text-foreground">{rest.length ? time : ""}</span>
                <span>{rest.length ? rest.join(" — ") : l}</span>
              </li>
            );
          })}
        </ol>
      </DialogContent>
    </Dialog>
  );
}
