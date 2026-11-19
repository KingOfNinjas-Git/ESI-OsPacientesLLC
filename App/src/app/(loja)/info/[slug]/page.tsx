// FICHEIRO: info/[slug]/page.tsx
// As páginas de informação do rodapé ( /info/contactos, /info/termos, ... ).
// O texto de todas está aqui em baixo, na lista `PAGES`.
// Para criar uma página nova basta acrescentar uma entrada à lista e uma ligação em `site-footer.tsx`.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container, PageTitle } from "@/components/layout/page-title";

// O "dicionário" das páginas: a chave (ex.: "contactos") é o que aparece no endereço,
// e o valor tem o título e os parágrafos (`body`) da página.
const PAGES: Record<string, { title: string; body: string[] }> = {
  contactos: {
    title: "Contactos",
    body: [
      "Email: geral@gamehaven.pt · Telefone: +351 210 000 000",
      "Horário: segunda a sábado, 10:00–23:00. Domingo, 14:00–20:00.",
      "Reparação de consolas: traz a tua consola à loja para um diagnóstico gratuito.",
    ],
  },
  alugueres: {
    title: "Alugueres",
    body: [
      "Os jogos alugados são levantados e devolvidos na loja, nas datas escolhidas no carrinho.",
      "O preço é calculado por dia. Atrasos na devolução são cobrados ao preço diário do jogo.",
      "Também alugamos consolas — fala connosco na loja.",
    ],
  },
  entregas: {
    title: "Entregas",
    body: ["O merch é enviado para a morada indicada por 3,50 €, em 2 a 4 dias úteis.", "Os bilhetes de eventos são enviados por e-mail."],
  },
  sobre: {
    title: "Sobre nós",
    body: [
      "A GameHaven é uma biblioteca de jogos e um terceiro espaço social.",
      "Vendemos e alugamos jogos e consolas, reparamos consolas, organizamos eventos temáticos e temos um bar para jogares connosco.",
    ],
  },
  termos: { title: "Termos e condições", body: ["Ao utilizar o site aceitas as condições de venda, aluguer e participação em eventos da GameHaven."] },
  privacidade: { title: "Privacidade", body: ["Os teus dados são usados apenas para processar encomendas e enviar bilhetes, em conformidade com o RGPD."] },
  devolucoes: { title: "Devoluções", body: ["Tens 14 dias para devolver artigos comprados em bom estado. Bilhetes de eventos não são reembolsáveis."] },
};

type Props = { params: Promise<{ slug: string }> };

// Estas páginas nunca mudam, por isso o Next.js gera-as uma só vez quando o site é construído (mais rápido).
// Aqui dizemos-lhe quais são: uma por cada chave de PAGES.
export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

// Título do separador do browser: o título da página, ou "Informação" se não existir.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: PAGES[(await params).slug]?.title ?? "Informação" };
}

export default async function InfoPage({ params }: Props) {
  // Procura a página pedida no dicionário. Se não existir, mostra a página 404.
  const page = PAGES[(await params).slug];
  if (!page) notFound();
  return (
    <Container className="max-w-2xl pb-16">
      <PageTitle>{page.title}</PageTitle>
      <div className="space-y-4 rounded-md bg-card p-6 text-foreground ring-1 ring-white/10">
        {/* Um parágrafo para cada texto da lista. */}
        {page.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </Container>
  );
}
