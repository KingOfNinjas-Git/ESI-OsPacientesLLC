// FICHEIRO: layout.tsx (layout raiz)
// Este é o "esqueleto" que envolve TODAS as páginas do site. Pensa numa moldura de quadro:
// a moldura é sempre a mesma e só a pintura (o conteúdo de cada página) é que muda.
//
// De fora para dentro, a estrutura é esta:
//   CartProvider   → dá o carrinho a qualquer componente (através do useCart)
//     SiteHeader   → cabeçalho (Figma "Header"): menu, logótipo, pesquisa, login, carrinho
//     NavBar       → barra de secções (Figma "Navbar")
//     <main>       → o conteúdo de cada página (children)
//     SiteFooter   → rodapé (Figma "Footer")
//     Toaster      → os avisos que aparecem no canto ("Adicionado ao carrinho", erros...)
//
// Aqui também carregamos as fontes e o CSS global (cores, classes próprias e animações em src/styles/).

import type { Metadata } from "next";
import { Chakra_Petch, Onest } from "next/font/google";
import "@/styles/globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { NavBar } from "@/components/layout/nav-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { CartProvider } from "@/components/cart/cart-provider";
import { Toaster } from "@/components/ui/sonner";
import { MotionProvider } from "@/components/motion/primitives";

// As duas fontes do site:
//  - Chakra Petch: títulos, separadores, preços e botões
//  - Onest: o texto normal (parágrafos)
const display = Chakra_Petch({ variable: "--font-chakra", subsets: ["latin"], weight: ["500", "600", "700"] });
const body = Onest({ variable: "--font-onest", subsets: ["latin"] });

// Título e descrição que aparecem no separador do browser e no Google.
// Cada página pode escolher o seu título, e o "template" acrescenta " · GameHaven" no fim (ex.: "Jogos · GameHaven").
export const metadata: Metadata = {
  title: { default: "GameHaven", template: "%s · GameHaven" },
  description: "Biblioteca de jogos e terceiro espaço social: compra e aluguer de jogos, merch e eventos temáticos.",
  icons: { icon: "/brand/logo.png" },
};

// O componente que desenha a moldura. O `children` é a página que está aberta no momento.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // Dizemos ao browser que a página está em português de Portugal e ligamos as duas fontes.
    <html lang="pt-PT" className={`${display.variable} ${body.variable}`}>
      {/* O corpo ocupa pelo menos o ecrã todo, em coluna, para o rodapé ficar sempre colado ao fundo. */}
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <MotionProvider>
          <CartProvider>
            <SiteHeader />
            <NavBar />
            {/* flex-1 faz o conteúdo esticar e empurrar o rodapé para baixo. */}
            <main className="flex-1">{children}</main>
            <SiteFooter />
            {/* Os avisos aparecem no canto inferior direito. */}
            <Toaster position="bottom-right" richColors theme="dark" />
          </CartProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
