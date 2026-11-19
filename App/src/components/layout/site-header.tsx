// FICHEIRO: site-header.tsx
// O cabeçalho do site (Figma "Header"): menu, logótipo, pesquisa, login e carrinho.
// Este componente corre no servidor: lê a sessão (`auth()`) para mostrar "Login" ou o nome da pessoa.
// A pesquisa é um formulário normal que abre /pesquisa?q=...

import Image from "next/image";
import Link from "next/link";
import { Search, UserRound } from "lucide-react";
import { auth } from "@/server/auth";
import { HeaderMenu } from "./header-menu";
import { CartButton } from "./cart-button";
import { UserMenu } from "./user-menu";

export async function SiteHeader() {
  // Pergunta quem tem sessão iniciada (se alguém tiver).
  const session = await auth();
  const user = session?.user;

  return (
    <header className="relative bg-brand-950 text-white after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-brand-300/40 after:to-transparent">
      <div className="mx-auto flex h-[99px] max-w-6xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
        {/* O menu ☰ à esquerda. */}
        <HeaderMenu role={user?.role} name={user?.firstName} />

        {/* O logótipo: clicar leva à página inicial. */}
        <Link href="/" className="flex h-full shrink-0 items-center" aria-label="GameHaven — página inicial">
          <Image src="/brand/logo.png" alt="GameHaven" width={88} height={88} priority className="size-[72px] sm:size-[88px]" />
        </Link>

        {/* A barra de pesquisa (escondida em ecrãs pequenos; para esses há outra mais abaixo). */}
        <form action="/pesquisa" className="relative ml-1 hidden max-w-[266px] flex-1 sm:block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-brand-300" />
          <input
            name="q"
            type="search"
            placeholder="Pesquisar"
            aria-label="Pesquisar"
            className="h-[26px] w-full rounded-full border border-brand-300/30 bg-white/[0.07] pr-3 pl-9 text-sm text-white transition placeholder:text-brand-300/80 hover:border-brand-300/60 focus:border-spark focus:bg-white/[0.12] focus:outline-none"
          />
        </form>

        {/* À direita: login (ou menu da conta) e carrinho. */}
        <div className="ml-auto flex items-center gap-5 sm:gap-8">
          {/* Com sessão mostra o menu da conta; sem sessão mostra o botão "Login". */}
          {user ? (
            <UserMenu name={user.firstName} role={user.role} />
          ) : (
            <Link href="/login" className="flex flex-col items-center gap-1 font-display text-xs font-medium text-white/85 transition hover:text-spark">
              <span>Login</span>
              <UserRound className="size-7" strokeWidth={1.5} />
            </Link>
          )}
          <CartButton />
        </div>
      </div>

      {/* A pesquisa para ecrãs pequenos (telemóvel): aparece por baixo do cabeçalho. */}
      <form action="/pesquisa" className="relative px-4 pb-3 sm:hidden">
        <Search className="pointer-events-none absolute top-[8px] left-7 size-4 text-brand-300" />
        <input
          name="q"
          type="search"
          placeholder="Pesquisar"
          aria-label="Pesquisar"
          className="h-8 w-full rounded-full border border-brand-300/30 bg-white/[0.07] pr-3 pl-9 text-sm text-white placeholder:text-brand-300/80 focus:border-spark focus:outline-none"
        />
      </form>
    </header>
  );
}
