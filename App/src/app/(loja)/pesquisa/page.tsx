// FICHEIRO: pesquisa/page.tsx
// Os resultados da barra de pesquisa ( /pesquisa?q=... ).
// Procura produtos (no nome, descrição e categoria) e eventos futuros (no nome e na frase de apresentação).
// O texto da pesquisa é limitado a 80 caracteres e entra no SQL como parâmetro (seguro).

import type { Metadata } from "next";
import Link from "next/link";
import { getProducts } from "@/server/data";
import { query } from "@/server/db";
import { ProductGrid } from "@/components/shop/product-card";
import { Container, PageTitle } from "@/components/layout/page-title";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Pesquisa" };
// A página é refeita a CADA pedido (os dados mudam: stock, preços, eventos), em vez de ficar guardada desde o build.
export const dynamic = "force-dynamic";

export default async function PesquisaPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  // Lê o texto pesquisado, tira espaços das pontas e corta nos 80 caracteres.
  const q = ((await searchParams).q ?? "").trim().slice(0, 80);
  // Se há texto: procura produtos e eventos ao mesmo tempo. Se não há: devolve duas listas vazias.
  const [products, events] = q
    ? await Promise.all([
        getProducts({ q }),
        query<{ slug: string; name: string; starts_at: Date }>(
          "SELECT slug, name, starts_at FROM events WHERE ends_at >= NOW() AND (name LIKE ? OR tagline LIKE ?) ORDER BY starts_at",
          [`%${q}%`, `%${q}%`],
        ),
      ])
    : [[], []];

  return (
    <Container className="space-y-6 pb-6">
      <PageTitle>{q ? `Resultados para “${q}”` : "Pesquisar"}</PageTitle>
      {/* Se encontrou eventos, mostra-os como etiquetas clicáveis. */}
      {events.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {events.map((e) => (
            <Link key={e.slug} href={`/eventos/${e.slug}`} className="rounded-full bg-brand-500 px-3 py-1 text-sm text-white hover:brightness-110">
              Evento: {e.name} · {formatDateTime(e.starts_at)}
            </Link>
          ))}
        </div>
      )}
      {/* Com texto mostra os produtos; sem texto pede à pessoa para escrever algo. */}
      {q ? <ProductGrid products={products} /> : <p className="text-center text-muted-foreground">Escreve o que procuras na barra de pesquisa.</p>}
    </Container>
  );
}
