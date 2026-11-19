// FICHEIRO: header-menu.tsx
// O menu lateral (botão ☰ no cabeçalho). Mostra as secções da loja e, conforme o papel da pessoa,
// "A minha conta" / "Área do trabalhador" / "Administração", e também entrar ou sair.
//
// "use client": corre no browser, porque abre e fecha um painel lateral.

"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import type { Role } from "@/lib/types";
import { signOutAction } from "@/server/actions/auth";

// As ligações que toda a gente vê.
const shopLinks = [
  { href: "/", label: "Home" },
  { href: "/promocoes", label: "Promoções" },
  { href: "/jogos", label: "Jogos" },
  { href: "/merch", label: "Merch" },
  { href: "/eventos", label: "Eventos" },
  { href: "/carrinho", label: "Carrinho" },
];

// O menu "hambúrguer" do cabeçalho.
//  - role: o papel da pessoa (ou nada, se não tiver sessão)
//  - name: o primeiro nome dela, para a saudação
export function HeaderMenu({ role, name }: { role?: Role; name?: string }) {
  // Ligações extra conforme o papel. O servidor volta a verificar o acesso em cada página, por isso isto é só para mostrar.
  //   - qualquer pessoa com sessão: "A minha conta"
  //   - trabalhador e administrador: "Área do trabalhador"
  //   - só administrador: "Administração"
  const accountLinks = [
    ...(role ? [{ href: "/conta", label: "A minha conta" }] : []),
    ...(role === "trabalhador" || role === "administrador" ? [{ href: "/trabalhador", label: "Área do trabalhador" }] : []),
    ...(role === "administrador" ? [{ href: "/admin", label: "Administração" }] : []),
  ];

  return (
    <Sheet>
      {/* O botão ☰ que abre o painel. */}
      <SheetTrigger
        className="grid size-10 shrink-0 place-items-center rounded-md transition hover:bg-white/10 hover:text-spark focus-visible:ring-2 focus-visible:ring-spark focus-visible:outline-none"
        aria-label="Abrir menu"
      >
        <Menu className="size-7" />
      </SheetTrigger>
      {/* O painel que desliza da esquerda. */}
      <SheetContent side="left" className="starfield border-none bg-brand-950 text-white">
        <SheetHeader>
          {/* Se a pessoa tem sessão, cumprimenta pelo nome; senão diz só "GameHaven". */}
          <SheetTitle className="font-display text-xl text-white">{name ? `Olá, ${name}` : "GameHaven"}</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4">
          {/* Ligações da loja. O SheetClose fecha o painel quando clicas. */}
          {shopLinks.map((l) => (
            <SheetClose key={l.href} nativeButton={false} render={<Link href={l.href} />} className="border-l-2 border-transparent px-3 py-2 text-left font-display text-[15px] font-medium transition hover:border-spark hover:bg-white/[0.06] hover:text-spark">
              {l.label}
            </SheetClose>
          ))}
          {/* Uma linha separadora, só se houver ligações de conta. */}
          {accountLinks.length > 0 && <div className="my-2 h-px bg-gradient-to-r from-brand-300/40 to-transparent" />}
          {accountLinks.map((l) => (
            <SheetClose key={l.href} nativeButton={false} render={<Link href={l.href} />} className="border-l-2 border-transparent px-3 py-2 text-left font-display text-[15px] font-medium transition hover:border-spark hover:bg-white/[0.06] hover:text-spark">
              {l.label}
            </SheetClose>
          ))}
          <div className="my-2 h-px bg-gradient-to-r from-brand-300/40 to-transparent" />
          {/* Com sessão: botão para terminar sessão. Sem sessão: "Iniciar sessão" e "Registar". */}
          {role ? (
            <form action={signOutAction}>
              <button className="w-full border-l-2 border-transparent px-3 py-2 text-left font-display text-[15px] font-medium transition hover:border-spark hover:bg-white/[0.06] hover:text-spark">Terminar sessão</button>
            </form>
          ) : (
            <>
              <SheetClose nativeButton={false} render={<Link href="/login" />} className="border-l-2 border-transparent px-3 py-2 text-left font-display text-[15px] font-medium transition hover:border-spark hover:bg-white/[0.06] hover:text-spark">
                Iniciar sessão
              </SheetClose>
              <SheetClose nativeButton={false} render={<Link href="/registar" />} className="border-l-2 border-transparent px-3 py-2 text-left font-display text-[15px] font-medium transition hover:border-spark hover:bg-white/[0.06] hover:text-spark">
                Registar
              </SheetClose>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
