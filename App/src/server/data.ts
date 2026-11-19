// FICHEIRO: data.ts
// Aqui estão as funções que LEEM da base de dados o catálogo (produtos) e os eventos.
// Só funcionam no servidor. As páginas chamam-nas diretamente, por exemplo:
//   await getProducts({ type: "jogo", onSale: true })
// As funções que ESCREVEM (stock, encomendas, utilizadores) estão em server/actions/* e em app/api/orders.

import "server-only";
import { query } from "./db";
import type { GameEvent, GameEventWithTickets, Product, TicketType } from "@/lib/types";

// ---------------------------------------------------------------------------
// Converter as linhas do MySQL para os tipos da nossa aplicação.
// O MySQL devolve "verdadeiro/falso" como 1/0 e, às vezes, listas como texto (JSON).
// Estas funções arrumam isso.
// ---------------------------------------------------------------------------

// "Row" é uma linha qualquer vinda do MySQL: um objeto com nomes de colunas e valores.
type Row = Record<string, unknown>;

// Transforma uma linha da tabela `products` num `Product` certinho.
const toProduct = (r: Row): Product => ({
  ...(r as unknown as Product),
  // 1/0 passa a true/false.
  is_new: Boolean(r.is_new),
  // Se os tamanhos vierem como texto, convertemos para uma lista a sério.
  sizes: typeof r.sizes === "string" ? JSON.parse(r.sizes) : (r.sizes as string[] | null),
});

// Transforma uma linha da tabela `events` num `GameEvent` certinho (mesma ideia).
const toEvent = (r: Row): GameEvent => ({
  ...(r as unknown as GameEvent),
  featured: Boolean(r.featured),
  organizers: typeof r.organizers === "string" ? JSON.parse(r.organizers) : (r.organizers as GameEvent["organizers"]),
});

// ---------------------------------------------------------------------------
// Produtos
// ---------------------------------------------------------------------------

// Os separadores de categoria da página inicial e da página Jogos (o que está no Figma em "Categorias").
export type HomeTab = "popular" | "novos" | "playstation" | "xbox" | "nintendo" | "pc";

// A lista desses separadores, com o texto que aparece em cada botão.
export const HOME_TABS: { id: HomeTab; label: string }[] = [
  { id: "popular", label: "Popular" },
  { id: "novos", label: "Novos Jogos" },
  { id: "playstation", label: "Playstation" },
  { id: "xbox", label: "Xbox" },
  { id: "nintendo", label: "Nintendo" },
  { id: "pc", label: "PC" },
];

// Os filtros que o `getProducts` aceita. Todos são opcionais e, se usares vários, aplicam-se todos ao mesmo tempo.
export interface ProductFilters {
  type?: "jogo" | "merch"; // só jogos ou só merch
  tab?: HomeTab; // um dos separadores da página inicial
  platform?: string;
  category?: string;
  q?: string; // texto da pesquisa
  onSale?: boolean; // só artigos em promoção
  rentable?: boolean; // só artigos que se podem alugar
  sort?: "popular" | "preco-asc" | "preco-desc" | "nome" | "novidades"; // como ordenar
  limit?: number; // máximo de resultados
}

// Lista produtos com filtros e ordenação.
// É usada na página inicial, Jogos, Merch, Promoções, Pesquisa e em "Também te pode interessar".
// O SQL é montado com pedaços fixos; o que o utilizador escreve entra sempre como parâmetro `?` (seguro).
export async function getProducts(f: ProductFilters = {}): Promise<Product[]> {
  // `where` guarda as condições (ex.: "type = ?") e `params` guarda os valores que vão nos pontos de interrogação.
  const where: string[] = [];
  const params: unknown[] = [];

  // Cada "if" abaixo acrescenta uma condição só se o filtro correspondente foi pedido.
  if (f.type) { where.push("type = ?"); params.push(f.type); }
  // Separadores de plataforma (playstation, xbox...) filtram pela plataforma. "popular" e "novos" são tratados à parte.
  if (f.tab && f.tab !== "popular" && f.tab !== "novos") { where.push("platform = ?"); params.push(f.tab); }
  if (f.tab === "novos") where.push("is_new = TRUE");
  if (f.platform) { where.push("platform = ?"); params.push(f.platform); }
  if (f.category) { where.push("category = ?"); params.push(f.category); }
  if (f.onSale) where.push("discount_percent > 0");
  if (f.rentable) where.push("rent_cents_per_day IS NOT NULL");
  // A pesquisa procura o texto no nome, na descrição e na categoria (os % significam "qualquer coisa à volta").
  if (f.q) { where.push("(name LIKE ? OR description LIKE ? OR category LIKE ?)"); params.push(`%${f.q}%`, `%${f.q}%`, `%${f.q}%`); }

  // Os modos de ordenação possíveis. Nos preços, a ordem já conta com o desconto aplicado.
  const order = {
    popular: "popularity DESC",
    "preco-asc": "price_cents * (100 - discount_percent) ASC",
    "preco-desc": "price_cents * (100 - discount_percent) DESC",
    nome: "name ASC",
    novidades: "is_new DESC, created_at DESC",
  }[f.sort ?? "popular"];

  // Monta a frase SQL final: junta as condições com AND (só se houver alguma), ordena e limita.
  const sql = `SELECT * FROM products ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY ${order}, id ASC ${f.limit ? "LIMIT ?" : ""}`;
  if (f.limit) params.push(f.limit);
  // Corre a consulta e converte cada linha para `Product`.
  return (await query<Row>(sql, params)).map(toProduct);
}

// Procura um produto pelo seu `slug` (o nome que aparece no endereço, ex.: /produto/fifa-26).
// Devolve `null` se não encontrar.
export async function getProductBySlug(slug: string) {
  const rows = await query<Row>("SELECT * FROM products WHERE slug = ?", [slug]);
  return rows[0] ? toProduct(rows[0]) : null;
}

// Lista as categorias diferentes que existem (de jogos ou de merch), para o filtro "Categoria".
export async function getCategories(type: "jogo" | "merch") {
  const rows = await query<{ category: string }>(
    "SELECT DISTINCT category FROM products WHERE type = ? AND category IS NOT NULL ORDER BY category",
    [type],
  );
  return rows.map((r) => r.category);
}

// ---------------------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------------------

// Cola a cada evento a lista dos seus bilhetes.
// Faz só UMA consulta para todos os eventos (mais rápido do que uma consulta por evento).
async function attachTickets(events: GameEvent[]): Promise<GameEventWithTickets[]> {
  // Sem eventos não há nada para fazer.
  if (!events.length) return [];
  // Vai buscar os bilhetes de todos esses eventos de uma vez.
  const tickets = await query<TicketType>(
    "SELECT * FROM ticket_types WHERE event_id IN (?) ORDER BY price_cents",
    [events.map((e) => e.id)],
  );
  // Para cada evento, escolhe só os bilhetes que lhe pertencem.
  return events.map((e) => ({ ...e, tickets: tickets.filter((t) => t.event_id === e.id) }));
}

// Devolve os eventos ordenados por data. Por omissão só mostra os que ainda não acabaram.
export async function getEvents({ upcomingOnly = true } = {}) {
  const rows = await query<Row>(
    `SELECT * FROM events ${upcomingOnly ? "WHERE ends_at >= NOW()" : ""} ORDER BY starts_at`,
  );
  return attachTickets(rows.map(toEvent));
}

// Procura um evento pelo `slug`, já com os bilhetes. Devolve `null` se não existir.
export async function getEventBySlug(slug: string) {
  const rows = await query<Row>("SELECT * FROM events WHERE slug = ?", [slug]);
  if (!rows[0]) return null;
  return (await attachTickets([toEvent(rows[0])]))[0];
}

// O evento a mostrar em destaque: o que está marcado como `featured` ou, se não houver, o próximo a acontecer.
export async function getFeaturedEvent() {
  const rows = await query<Row>(
    "SELECT * FROM events WHERE ends_at >= NOW() ORDER BY featured DESC, starts_at LIMIT 1",
  );
  if (!rows[0]) return null;
  return (await attachTickets([toEvent(rows[0])]))[0];
}
