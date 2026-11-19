// FICHEIRO: site-footer.tsx
// O rodapé que aparece em todas as páginas (está incluído em app/layout.tsx).
// Tem: logótipo, redes sociais, colunas de ligações, contacto e métodos de pagamento.

import { Reveal } from "@/components/motion/primitives";
import Image from "next/image";
import Link from "next/link";
import { Camera, MonitorPlay, ThumbsUp, Tv } from "lucide-react";

// Os métodos de pagamento aceites (os logótipos estão em public/payments/).
const payments = [
  { src: "/payments/multibanco.png", alt: "Multibanco", w: 47, h: 56 },
  { src: "/payments/mbway.png", alt: "MB WAY", w: 100, h: 49 },
  { src: "/payments/visa-mastercard.png", alt: "Visa e Mastercard", w: 104, h: 56 },
];

// As três colunas de ligações. As páginas /info/* estão em app/(loja)/info/[slug]/page.tsx.
const columns = [
  {
    title: "Ajuda",
    links: [
      { href: "/info/contactos", label: "Contactos" },
      { href: "/info/alugueres", label: "Alugueres" },
      { href: "/info/entregas", label: "Entregas" },
    ],
  },
  {
    title: "A loja",
    links: [
      { href: "/info/sobre", label: "Sobre nós" },
      { href: "/jogos", label: "Jogos" },
      { href: "/eventos", label: "Eventos" },
    ],
  },
  {
    title: "Informações",
    links: [
      { href: "/info/termos", label: "Termos" },
      { href: "/info/privacidade", label: "Privacidade" },
      { href: "/info/devolucoes", label: "Devoluções" },
    ],
  },
];

// As redes sociais (abrem noutro separador do browser).
// TODO: trocar pelos perfis reais da loja.
const social = [
  { href: "https://instagram.com", label: "Instagram", icon: Camera },
  { href: "https://facebook.com", label: "Facebook", icon: ThumbsUp },
  { href: "https://twitch.tv", label: "Twitch", icon: Tv },
  { href: "https://youtube.com", label: "YouTube", icon: MonitorPlay },
];

// O rodapé completo (Figma "Footer").
export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pt-6 pb-8 sm:px-8">
      <Reveal y={20}>
      <div className="grid gap-8 md:grid-cols-[230px_1fr_auto] md:items-end">
        {/* Coluna 1: logótipo e redes sociais. */}
        <div className="space-y-4">
          <Link href="/" className="cut-tr starfield flex h-[72px] items-center gap-3 bg-brand-950 px-4 [--cut:14px]">
            <Image src="/brand/logo.png" alt="" width={56} height={56} />
            <span className="font-display text-xl font-bold text-white">GameHaven</span>
          </Link>
          <div className="cut-tr flex h-[55px] items-center justify-between gap-3 bg-brand-900 px-4 [--cut:10px]">
            <span className="font-display text-[13px] font-medium whitespace-nowrap text-brand-300">Social media</span>
            <div className="flex gap-2.5">
              {/* Um ícone para cada rede social. */}
              {social.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} className="text-white transition hover:text-spark">
                  <s.icon className="size-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna 2: as três colunas de ligações. */}
        <div className="grid grid-cols-3 gap-4 self-start">
          {columns.map((c) => (
            <div key={c.title}>
              <p className="mb-3 font-display text-sm font-bold text-foreground">{c.title}</p>
              <ul className="space-y-3 text-[13px] text-muted-foreground">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="transition hover:text-spark">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Coluna 3: contacto e métodos de pagamento. */}
        <div>
          <p className="mb-3 text-sm">
            <span className="mr-2 font-display font-bold text-foreground">Contact</span>
            <a href="mailto:geral@gamehaven.pt" className="text-brand-300 underline decoration-brand-300/40 underline-offset-4 hover:decoration-brand-500">
              geral@gamehaven.pt
            </a>
          </p>
          {/* Os logótipos têm cores escuras próprias: ficam sobre "azulejos" claros para se verem no tema escuro. */}
          <div className="flex items-center gap-3">
            {payments.map((p) => (
              <span key={p.alt} className="flex items-center rounded-md bg-white px-2 py-1 shadow-[0_2px_10px_rgb(0_0_0/0.25)] ring-1 ring-white/20">
                <Image src={p.src} alt={p.alt} width={p.w} height={p.h} className="h-10 w-auto" />
              </span>
            ))}
          </div>
        </div>
      </div>
      </Reveal>
      {/* A linha de direitos no fim. O ano é calculado sozinho para nunca ficar desatualizado. */}
      <p className="mt-8 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} GameHaven, um projeto OsPacientesLLC</p>
    </footer>
  );
}
