// FICHEIRO: user-menu.tsx
// O menu da conta no cabeçalho (aparece quando há sessão iniciada): mostra o nome, o papel
// e ligações para "A minha conta" / "Área do trabalhador" / "Administração", e "Terminar sessão".
//
// "use client": corre no browser, porque é um menu que abre e fecha.

"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Role } from "@/lib/types";
import { signOutAction } from "@/server/actions/auth";

// Como escrever cada papel no ecrã (com maiúscula inicial).
const roleLabel: Record<Role, string> = {
  cliente: "Cliente",
  trabalhador: "Trabalhador",
  administrador: "Administrador",
};

export function UserMenu({ name, role }: { name: string; role: Role }) {
  return (
    <DropdownMenu>
      {/* O botão que abre o menu: o primeiro nome e o ícone da pessoa. */}
      <DropdownMenuTrigger className="flex flex-col items-center gap-1 font-display text-xs font-medium text-white/85 outline-none transition hover:text-spark focus-visible:text-spark">
        <span className="max-w-20 truncate">{name}</span>
        <UserRound className="size-7" strokeWidth={1.5} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {/* Cabeçalho do menu: nome e papel. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block font-display text-sm text-foreground">{name}</span>
            <span className="text-xs font-normal">{roleLabel[role]}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/conta" />}>A minha conta</DropdownMenuItem>
        {/* "Área do trabalhador": só para trabalhadores e administradores. */}
        {(role === "trabalhador" || role === "administrador") && (
          <DropdownMenuItem render={<Link href="/trabalhador" />}>Área do trabalhador</DropdownMenuItem>
        )}
        {/* "Administração": só para administradores. */}
        {role === "administrador" && <DropdownMenuItem render={<Link href="/admin" />}>Administração</DropdownMenuItem>}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOutAction()}>Terminar sessão</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
