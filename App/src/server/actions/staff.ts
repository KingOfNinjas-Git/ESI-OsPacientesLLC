// FICHEIRO: actions/staff.ts
// Aqui estão as ações da Área do trabalhador e da Administração
// (criar produtos, mudar stock, gerir eventos, utilizadores e encomendas).
//
// Cada função é chamada por um `<form action={...}>` em /trabalhador ou /admin e faz sempre 4 passos:
//   1. confirma o papel com `requireRole` (nunca confiar só no middleware);
//   2. valida os dados do formulário;
//   3. altera a base de dados;
//   4. chama `refresh()` / `revalidatePath` para as páginas mostrarem os dados novos.
//
// Quem pode o quê: trabalhador e administrador gerem stock, produtos, eventos e encomendas;
// só o administrador apaga produtos/eventos e gere utilizadores.

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { execute, query } from "@/server/db";
import { setOrderStatus } from "@/server/orders";
import { requireRole } from "@/server/session";

// Converte o texto do formulário em cêntimos. Aceita vírgula ou ponto. Ex.: "44,99" → 4499
const euroToCents = (v: FormDataEntryValue | null) => Math.round(Number(String(v ?? "0").replace(",", ".")) * 100);

// Transforma um nome num texto próprio para endereços (URL). Ex.: "Noite de Jogos!" → "noite-de-jogos"
const slugify = (s: string) =>
  s
    .normalize("NFD") // separa as letras dos acentos (ex.: "é" vira "e" + acento)
    .replace(/[̀-ͯ]/g, "") // apaga os acentos soltos
    .toLowerCase() // tudo em minúsculas
    .replace(/[^a-z0-9]+/g, "-") // tudo o que não é letra ou número vira um traço
    .replace(/(^-|-$)/g, "") // tira traços do início e do fim
    .slice(0, 100); // no máximo 100 caracteres

// Obriga o Next.js a refazer as páginas da loja que mostram produtos e eventos,
// para não ficarem a mostrar dados antigos.
function refresh() {
  for (const p of ["/", "/jogos", "/merch", "/promocoes", "/eventos", "/trabalhador", "/admin"]) revalidatePath(p);
}

/* ---------- Trabalhador: produtos ---------- */

// Atualiza o stock, o preço, o desconto (0 a 90%) e o preço de aluguer por dia (vazio = não se pode alugar).
export async function updateProductAction(formData: FormData) {
  await requireRole("trabalhador", "administrador");
  const id = Number(formData.get("id"));
  // Os Math.max / Math.min servem para os valores nunca saírem dos limites (ex.: stock nunca negativo).
  const stock = Math.max(0, Math.trunc(Number(formData.get("stock"))));
  const price = euroToCents(formData.get("price"));
  const discount = Math.min(90, Math.max(0, Math.trunc(Number(formData.get("discount")))));
  const rentRaw = String(formData.get("rent") ?? "").trim();
  const rent = rentRaw === "" ? null : euroToCents(rentRaw);
  // Se o id ou o preço não fizerem sentido, não faz nada.
  if (!id || !Number.isFinite(price) || price <= 0) return;
  await query("UPDATE products SET stock = ?, price_cents = ?, discount_percent = ?, rent_cents_per_day = ? WHERE id = ?", [stock, price, discount, rent, id]);
  refresh();
}

// As regras que o formulário de "novo produto" tem de cumprir.
const newProductSchema = z.object({
  name: z.string().trim().min(2).max(160),
  type: z.enum(["jogo", "merch"]),
  platform: z.enum(["", "playstation", "xbox", "nintendo", "pc", "tabuleiro"]),
  category: z.string().trim().max(60),
  description: z.string().trim().min(5).max(2000),
  price: z.string(),
  rent: z.string().optional(),
  stock: z.coerce.number().int().min(0),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/), // uma cor no formato #RRGGBB
});

// Cria um produto novo (marcado como "Novo").
// O slug leva um sufixo com a hora para nunca bater certo com outro produto do mesmo nome.
// Fica sem capa (image_url fica NULL).
export async function createProductAction(formData: FormData) {
  await requireRole("trabalhador", "administrador");
  // Valida o formulário. Se estiver mal, dá erro e não chega a tocar na base de dados.
  const d = newProductSchema.parse(Object.fromEntries(formData));
  const price = euroToCents(d.price);
  // Só os jogos se podem alugar, e só se o preço de aluguer foi preenchido.
  const rent = d.type === "jogo" && d.rent?.trim() ? euroToCents(d.rent) : null;
  await query(
    `INSERT INTO products (slug, type, name, description, platform, category, price_cents, rent_cents_per_day, stock, is_new, color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?)`,
    [`${slugify(d.name)}-${Date.now().toString(36)}`, d.type, d.name, d.description, d.type === "jogo" ? d.platform || null : null, d.category || null, price, rent, d.stock, d.color],
  );
  refresh();
}

// Apaga um produto (só o administrador). As encomendas antigas mantêm o nome e o preço que tinham.
export async function deleteProductAction(formData: FormData) {
  await requireRole("administrador");
  await query("DELETE FROM products WHERE id = ?", [Number(formData.get("id"))]);
  refresh();
}

/* ---------- Trabalhador: eventos ---------- */

// Atualiza o stock e o preço de um tipo de bilhete.
export async function updateTicketAction(formData: FormData) {
  await requireRole("trabalhador", "administrador");
  const id = Number(formData.get("id"));
  const stock = Math.max(0, Math.trunc(Number(formData.get("stock"))));
  const price = euroToCents(formData.get("price"));
  await query("UPDATE ticket_types SET stock = ?, price_cents = ? WHERE id = ?", [stock, price, id]);
  refresh();
}

// As regras que o formulário de "novo evento" tem de cumprir.
const newEventSchema = z.object({
  name: z.string().trim().min(2).max(160),
  tagline: z.string().trim().max(255),
  description: z.string().trim().min(5),
  program: z.string().trim(),
  startsAt: z.string().min(10),
  endsAt: z.string().min(10),
  location: z.string().trim().min(2).max(160),
  capacity: z.coerce.number().int().min(1),
  minAge: z.coerce.number().int().min(0).max(21),
  ticketName: z.string().trim().min(2),
  ticketPrice: z.string(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

// Cria um evento e o seu primeiro tipo de bilhete (com stock igual à lotação).
// Os organizadores são preenchidos automaticamente com a equipa e com quem criou o evento.
export async function createEventAction(formData: FormData) {
  const user = await requireRole("trabalhador", "administrador");
  const d = newEventSchema.parse(Object.fromEntries(formData));
  // A lista de "ficha técnica" do evento (organizador, contacto, local...).
  const organizers = [
    { label: "Organizador", value: "Equipa GameHaven" },
    { label: "Responsável", value: user.name ?? user.firstName },
    { label: "Contacto", value: "eventos@gamehaven.pt" },
    { label: "Telefone", value: "+351 210 000 000" },
    { label: "Local", value: d.location },
    { label: "Instagram", value: "@gamehaven" },
  ];
  // Cria o evento e guarda o id que a base de dados lhe deu (`insertId`).
  const { insertId } = await execute(
    `INSERT INTO events (slug, name, tagline, description, program, starts_at, ends_at, location, capacity, min_age, organizers, color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [`${slugify(d.name)}-${Date.now().toString(36)}`, d.name, d.tagline, d.description, d.program || "Programa a anunciar", new Date(d.startsAt), new Date(d.endsAt), d.location, d.capacity, d.minAge, JSON.stringify(organizers), d.color],
  );
  // Cria o primeiro bilhete desse evento, usando o id acabado de receber.
  await query("INSERT INTO ticket_types (event_id, name, price_cents, stock) VALUES (?, ?, ?, ?)", [insertId, d.ticketName, euroToCents(d.ticketPrice), d.capacity]);
  refresh();
}

// Define o evento em destaque: este fica `featured` e todos os outros deixam de estar.
export async function toggleFeaturedAction(formData: FormData) {
  await requireRole("trabalhador", "administrador");
  const id = Number(formData.get("id"));
  // `(id = ?)` dá verdadeiro só para o evento escolhido e falso para todos os outros.
  await query("UPDATE events SET featured = (id = ?)", [id]);
  refresh();
}

// Apaga um evento e os seus bilhetes (só o administrador).
export async function deleteEventAction(formData: FormData) {
  await requireRole("administrador");
  await query("DELETE FROM events WHERE id = ?", [Number(formData.get("id"))]);
  refresh();
}

/* ---------- Administrador: utilizadores e encomendas ---------- */

// Muda o papel de um utilizador. O administrador não se pode tirar o acesso a si próprio.
export async function updateUserRoleAction(formData: FormData) {
  const admin = await requireRole("administrador");
  const id = Number(formData.get("id"));
  // Só aceita um dos 3 papéis que existem.
  const role = z.enum(["cliente", "trabalhador", "administrador"]).parse(formData.get("role"));
  if (String(id) === admin.id && role !== "administrador") return; // não deixa remover o próprio acesso
  await query("UPDATE users SET role = ? WHERE id = ?", [role, id]);
  revalidatePath("/admin");
}

// Apaga uma conta (menos a do próprio administrador). As encomendas dessa conta ficam sem utilizador associado.
export async function deleteUserAction(formData: FormData) {
  const admin = await requireRole("administrador");
  const id = Number(formData.get("id"));
  if (String(id) === admin.id) return; // não se apaga a si próprio
  await query("DELETE FROM users WHERE id = ?", [id]);
  revalidatePath("/admin");
}

// Muda o estado de uma encomenda, por exemplo para "pago" quando chega um pagamento Multibanco.
// Cancelar devolve o stock; uma encomenda já cancelada não pode mudar de estado (ver src/server/orders.ts).
export async function updateOrderStatusAction(formData: FormData) {
  await requireRole("trabalhador", "administrador");
  const status = z.enum(["pendente", "pago", "cancelado"]).parse(formData.get("status"));
  await setOrderStatus(Number(formData.get("id")), status);
  revalidatePath("/admin");
  revalidatePath("/trabalhador");
  // Ao cancelar, o stock mudou, por isso as páginas da loja também têm de ser atualizadas.
  if (status === "cancelado") refresh();
}
