// FICHEIRO: trabalhador/page.tsx
// A Área do trabalhador ( /trabalhador ) — para trabalhadores e administradores.
//
// Tem três separadores:
//   - Produtos e stock: uma tabela com um formulário por linha (stock, preço, desconto, aluguer/dia)
//     e um formulário "Novo produto".
//   - Eventos: um painel por evento (pôr em destaque, stock e preço dos bilhetes)
//     e um formulário "Novo evento".
//   - Encomendas: as últimas 30 encomendas, com possibilidade de mudar o estado.
//
// Os formulários chamam diretamente as ações do servidor (server/actions/staff.ts), sem JavaScript próprio:
// quando carregas em "Guardar", a ação grava na base de dados e a página recarrega com os dados novos.

import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/server/session";
import { getEvents, getProducts } from "@/server/data";
import { query } from "@/server/db";
import { formatDateTime, platformLabel } from "@/lib/format";
import { Container, PageTitle } from "@/components/layout/page-title";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cellInput, Field, fieldInput, Panel, smallBtn } from "@/components/staff/ui";
import { OrdersTable } from "@/components/staff/orders-table";
import {
  createEventAction,
  createProductAction,
  toggleFeaturedAction,
  updateProductAction,
  updateTicketAction,
} from "@/server/actions/staff";

export const metadata: Metadata = { title: "Área do trabalhador" };
// A página é refeita a CADA pedido (os dados mudam: stock, preços, eventos), em vez de ficar guardada desde o build.
export const dynamic = "force-dynamic";

// Converte cêntimos em texto para os campos de números (4499 → "44.99"; sem valor → campo vazio).
const toEuro = (c: number | null) => (c == null ? "" : (c / 100).toFixed(2));

export default async function TrabalhadorPage() {
  // Só trabalhadores e administradores passam.
  const user = await requireRole("trabalhador", "administrador");
  // Vai buscar, ao mesmo tempo: todos os produtos (por nome), todos os eventos (mesmo os já terminados) e as últimas 30 encomendas.
  const [products, events, orders] = await Promise.all([
    getProducts({ sort: "nome" }),
    getEvents({ upcomingOnly: false }),
    query<{ id: number; contact_name: string; status: string; total_cents: number; created_at: Date; payment_method: string }>(
      "SELECT * FROM orders ORDER BY created_at DESC LIMIT 30",
    ),
  ]);

  return (
    <Container className="space-y-6 pb-10">
      <PageTitle>Área do trabalhador</PageTitle>
      <p className="-mt-4 text-center text-sm text-muted-foreground">Olá, {user.firstName}. Atualiza stock, informações de produtos e eventos.</p>

      {/* Os 3 separadores. O que abre primeiro é o dos produtos. */}
      <Tabs defaultValue="produtos">
        <TabsList className="mx-auto">
          <TabsTrigger value="produtos">Produtos e stock</TabsTrigger>
          <TabsTrigger value="eventos">Eventos</TabsTrigger>
          <TabsTrigger value="encomendas">Encomendas</TabsTrigger>
        </TabsList>

        {/* ---------- Separador: produtos e stock ---------- */}
        <TabsContent value="produtos" className="mt-6 space-y-6">
          <Panel title={`Catálogo (${products.length})`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2">Artigo</th>
                    <th>Stock</th>
                    <th>Preço (€)</th>
                    <th>Desconto (%)</th>
                    <th>Aluguer €/dia</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {/* Uma linha da tabela por cada produto. */}
                  {products.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2 pr-3">
                        <Link href={`/produto/${p.slug}`} className="font-medium hover:underline">
                          {p.name}
                        </Link>
                        <span className="block text-xs text-muted-foreground">
                          {p.type === "merch" ? "Merch" : "Jogo"}
                          {p.platform ? ` · ${platformLabel[p.platform]}` : ""}
                          {/* Aviso de stock baixo: 3 unidades ou menos. */}
                          {p.stock <= 3 && <span className="ml-1 font-medium text-amber-700">· stock baixo</span>}
                        </span>
                      </td>
                      <td colSpan={5}>
                        {/* Um formulário por produto; o id vai num campo escondido para a ação saber qual produto atualizar. */}
                        <form action={updateProductAction} className="flex items-center gap-3">
                          <input type="hidden" name="id" value={p.id} />
                          <input name="stock" type="number" min={0} defaultValue={p.stock} className={cellInput} aria-label={`Stock de ${p.name}`} />
                          <input name="price" type="number" min={0.01} step={0.01} defaultValue={toEuro(p.price_cents)} className={cellInput} aria-label="Preço" />
                          <input name="discount" type="number" min={0} max={90} defaultValue={p.discount_percent} className={cellInput} aria-label="Desconto" />
                          {/* O merch não se aluga, por isso este campo fica desativado para ele. */}
                          <input
                            name="rent"
                            type="number"
                            min={0}
                            step={0.01}
                            defaultValue={toEuro(p.rent_cents_per_day)}
                            placeholder="—"
                            disabled={p.type === "merch"}
                            className={cellInput}
                            aria-label="Aluguer por dia"
                          />
                          <button className={smallBtn}>Guardar</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* Formulário para criar um produto novo. */}
          <Panel title="Novo produto">
            <form action={createProductAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Nome" className="lg:col-span-2">
                <input name="name" required className={fieldInput} />
              </Field>
              <Field label="Tipo">
                <select name="type" className={fieldInput}>
                  <option value="jogo">Jogo</option>
                  <option value="merch">Merch</option>
                </select>
              </Field>
              <Field label="Plataforma (jogos)">
                <select name="platform" className={fieldInput}>
                  <option value="">—</option>
                  {/* Cria uma opção por cada plataforma da lista platformLabel. */}
                  {Object.entries(platformLabel).map(([id, l]) => (
                    <option key={id} value={id}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Descrição" className="sm:col-span-2 lg:col-span-4">
                <input name="description" required className={fieldInput} />
              </Field>
              <Field label="Categoria">
                <input name="category" className={fieldInput} placeholder="p.ex. Estratégia" />
              </Field>
              <Field label="Preço (€)">
                <input name="price" type="number" step={0.01} min={0.01} required className={fieldInput} />
              </Field>
              <Field label="Aluguer €/dia (opcional)">
                <input name="rent" type="number" step={0.01} min={0} className={fieldInput} />
              </Field>
              <Field label="Stock">
                <input name="stock" type="number" min={0} defaultValue={1} required className={fieldInput} />
              </Field>
              <Field label="Cor do cartão">
                <input name="color" type="color" defaultValue="#250663" className="h-9 w-full rounded-md border" />
              </Field>
              <div className="flex items-end">
                <button className={`${smallBtn} h-9 w-full`}>Adicionar produto</button>
              </div>
            </form>
          </Panel>
        </TabsContent>

        {/* ---------- Separador: eventos ---------- */}
        <TabsContent value="eventos" className="mt-6 space-y-6">
          {/* Uma caixa por cada evento. */}
          {events.map((e) => (
            <Panel
              key={e.id}
              title={e.name}
              actions={
                <div className="flex items-center gap-2">
                  {/* Se já é o destaque mostra uma etiqueta; senão mostra o botão para o pôr em destaque. */}
                  {e.featured ? (
                    <span className="rounded bg-brand-500/20 px-2 py-1 text-xs text-foreground">Em destaque</span>
                  ) : (
                    <form action={toggleFeaturedAction}>
                      <input type="hidden" name="id" value={e.id} />
                      <button className="h-8 rounded border px-3 text-xs hover:bg-muted">Pôr em destaque</button>
                    </form>
                  )}
                  <Link href={`/eventos/${e.slug}`} className="h-8 rounded border px-3 text-xs leading-8 hover:bg-muted">
                    Ver página
                  </Link>
                </div>
              }
            >
              <p className="mb-3 text-sm text-muted-foreground">
                {formatDateTime(e.starts_at)} · {e.location} · lotação {e.capacity}
              </p>
              <div className="space-y-2">
                {/* Uma linha por cada tipo de bilhete, com o seu próprio formulário de stock e preço. */}
                {e.tickets.map((t) => (
                  <form key={t.id} action={updateTicketAction} className="flex flex-wrap items-center gap-3 text-sm">
                    <input type="hidden" name="id" value={t.id} />
                    <span className="w-56">{t.name}</span>
                    <label className="flex items-center gap-1 text-xs">
                      Stock
                      <input name="stock" type="number" min={0} defaultValue={t.stock} className={cellInput} />
                    </label>
                    <label className="flex items-center gap-1 text-xs">
                      Preço €
                      <input name="price" type="number" step={0.01} min={0} defaultValue={toEuro(t.price_cents)} className={cellInput} />
                    </label>
                    <button className={smallBtn}>Guardar</button>
                  </form>
                ))}
              </div>
            </Panel>
          ))}

          {/* Formulário para criar um evento novo. */}
          <Panel title="Novo evento">
            <form action={createEventAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Nome" className="lg:col-span-2">
                <input name="name" required className={fieldInput} />
              </Field>
              <Field label="Subtítulo" className="lg:col-span-2">
                <input name="tagline" className={fieldInput} />
              </Field>
              <Field label="Descrição" className="sm:col-span-2 lg:col-span-4">
                <textarea name="description" required rows={2} className={`${fieldInput} h-auto py-2`} />
              </Field>
              <Field label="Programa (uma linha por ponto, p.ex. 19:00 — Abertura)" className="sm:col-span-2 lg:col-span-4">
                <textarea name="program" rows={3} className={`${fieldInput} h-auto py-2`} />
              </Field>
              <Field label="Início">
                <input name="startsAt" type="datetime-local" required className={fieldInput} />
              </Field>
              <Field label="Fim">
                <input name="endsAt" type="datetime-local" required className={fieldInput} />
              </Field>
              <Field label="Local">
                <input name="location" required defaultValue="GameHaven — Sala principal" className={fieldInput} />
              </Field>
              <Field label="Lotação">
                <input name="capacity" type="number" min={1} defaultValue={40} required className={fieldInput} />
              </Field>
              <Field label="Idade mínima">
                <input name="minAge" type="number" min={0} max={21} defaultValue={0} className={fieldInput} />
              </Field>
              <Field label="Tipo de bilhete">
                <input name="ticketName" required defaultValue="Entrada geral" className={fieldInput} />
              </Field>
              <Field label="Preço do bilhete (€)">
                <input name="ticketPrice" type="number" step={0.01} min={0} required defaultValue="5.00" className={fieldInput} />
              </Field>
              <Field label="Cor">
                <input name="color" type="color" defaultValue="#250663" className="h-9 w-full rounded-md border" />
              </Field>
              <div className="flex items-end sm:col-span-2 lg:col-span-4">
                <button className={`${smallBtn} h-9`}>Criar evento</button>
              </div>
            </form>
          </Panel>
        </TabsContent>

        {/* ---------- Separador: encomendas ---------- */}
        <TabsContent value="encomendas" className="mt-6">
          <Panel title="Últimas encomendas">
            <OrdersTable orders={orders} />
          </Panel>
        </TabsContent>
      </Tabs>
    </Container>
  );
}
