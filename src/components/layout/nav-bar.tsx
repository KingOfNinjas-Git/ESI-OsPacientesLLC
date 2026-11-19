// FICHEIRO: nav-bar.tsx
// A barra de navegação (Figma "Navbar"): quatro botões separados por linhas.
// Como no protótipo, mostra as secções PARA ONDE podes ir, por isso a secção em que já estás é escondida.
//
// "use client": corre no browser, porque precisa de saber em que página estás (usePathname) para a esconder.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Gamepad2, Home, Percent, Shirt, type LucideIcon } from "lucide-react";
import { Fragment } from "react";

// As cinco secções possíveis. Mostram-se sempre quatro (todas menos a atual).
const SECTIONS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/promocoes", label: "Promoções", icon: Percent },
  { href: "/jogos", label: "Jogos", icon: Gamepad2 },
  { href: "/merch", label: "Merch", icon: Shirt },
  { href: "/eventos", label: "Eventos", icon: CalendarDays },
];

export function NavBar() {
  // O caminho da página atual (ex.: "/jogos").
  const pathname = usePathname();
  // Descobre qual é a secção atual. Procura primeiro nas secções que não são a Home (por o endereço começar igual);
  // se não encontrar e estivermos na página inicial ("/"), a atual é a Home; senão, nenhuma.
  const current = SECTIONS.slice(1).find((s) => pathname.startsWith(s.href))?.href ?? (pathname === "/" ? "/" : null);
  // Mostra todas menos a atual, e no máximo 4.
  const visible = SECTIONS.filter((s) => s.href !== current).slice(0, 4);

  return (
    <nav aria-label="Secções" className="bg-gradient-to-b from-brand-900 to-[#1d0552]">
      <div className="mx-auto flex h-[99px] max-w-6xl items-center justify-around px-2 sm:px-6">
        {visible.map((s, i) => (
          <Fragment key={s.href}>
            {/* Uma linha vertical entre os botões (não aparece antes do primeiro). */}
            {i > 0 && <span aria-hidden className="h-[80px] w-px bg-gradient-to-b from-transparent via-brand-300/60 to-transparent" />}
            <Link
              href={s.href}
              className="chamfer group flex h-[79px] w-[22%] max-w-[124px] flex-col items-center justify-center gap-1.5 text-white transition-transform duration-300 ease-[var(--ease-apple)] hover:-translate-y-0.5 [--ch-fill:rgb(255_255_255/0.06)] [--ch-line:rgb(185_164_255/0.35)] [--cut:12px] hover:[--ch-fill:rgb(255_255_255/0.12)] hover:[--ch-line:var(--spark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spark"
            >
              <s.icon className="size-7 text-brand-300 transition duration-300 group-hover:scale-110 group-hover:text-spark" strokeWidth={1.5} />
              <span className="font-display text-xs font-semibold tracking-wide sm:text-sm">{s.label}</span>
            </Link>
          </Fragment>
        ))}
      </div>
    </nav>
  );
}
