// FICHEIRO: api/orders/route.ts
// Aqui nasce uma encomenda. É a parte mais importante (e mais cuidadosa) de toda a loja:
// recebe o carrinho do browser, confere tudo na base de dados e grava a compra.
import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { auth } from "@/server/auth";
import { pool } from "@/server/db";
import { orderTotals } from "@/lib/pricing";
import { rateLimit } from "@/lib/rate-limit";
import { expireStaleOrders } from "@/server/orders";

// O "molde" de cada item que o carrinho nos envia. Só aceitamos ids e quantidades:
// os preços que vierem do browser são ignorados (alguém podia tentar enganar-nos e mandar um preço mais baixo).
// Há 3 tipos de item: compra, aluguer e bilhete.
const itemSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("compra"), productId: z.number().int(), quantity: z.number().int().min(1).max(20), size: z.string().max(5).optional() }),
  z.object({
    kind: z.literal("aluguer"),
    productId: z.number().int(),
    quantity: z.number().int().min(1).max(5),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // data no formato AAAA-MM-DD
    days: z.number().int().min(1).max(14), // no máximo 14 dias
  }),
  z.object({ kind: z.literal("bilhete"), ticketTypeId: z.number().int(), quantity: z.number().int().min(1).max(20) }),
]);

// O "molde" do pedido completo: os itens, os dados de contacto e entrega, a forma de pagamento e o código promocional.
const orderSchema = z.object({
  items: z.array(itemSchema).min(1).max(50),
  details: z.object({
    name: z.string().trim().min(3).max(160),
    email: z.string().trim().email(),
    address: z.string().trim().max(255).optional().default(""),
    postalCode: z.string().trim().max(8).optional().default(""),
    city: z.string().trim().max(120).optional().default(""),
  }),
  paymentMethod: z.enum(["mbway", "multibanco", "cartao"]),
  phone: z.string().optional(),
  promoCode: z.string().trim().toUpperCase().optional(),
  acceptTerms: z.literal(true), // tem de ter aceitado os termos
});

// Um erro "normal" do negócio (ex.: sem stock, artigo apagado), cuja mensagem podemos mostrar ao cliente.
// Os outros erros são inesperados e não queremos mostrar os detalhes técnicos a ninguém.
class OrderError extends Error {}

// POST /api/orders — cria a encomenda.
// Os preços e o stock são SEMPRE lidos da base de dados (nunca confiamos no carrinho do browser).
// O pagamento é SIMULADO: não há ligação real ao MB WAY, Multibanco ou cartões.
//
// Tudo corre dentro de uma TRANSAÇÃO: se um passo falhar (ex.: um artigo esgotou entretanto),
// nada fica gravado e o stock não muda. O `FOR UPDATE` tranca as linhas lidas até ao fim,
// para duas pessoas não comprarem a última unidade ao mesmo tempo.
//
// Respostas possíveis: 200 { id, status, total, paymentRef } · 400 dados inválidos ·
// 401 sem sessão · 409 problema de stock/negócio · 429 demasiados pedidos · 500 erro inesperado.
export async function POST(req: Request) {
  // Só quem tem sessão iniciada pode comprar.
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Inicia sessão para concluir a compra." }, { status: 401 });

  // No máximo 10 encomendas por utilizador a cada 10 minutos (trava abusos e cliques repetidos).
  const limit = rateLimit(`order:${session.user.id}`, 10, 10 * 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Demasiadas tentativas. Tenta de novo dentro de alguns minutos." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } });
  }

  // Lê o corpo do pedido e confere se está de acordo com o molde. Se não estiver, respondemos 400.
  const parsed = orderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados da encomenda inválidos.", issues: parsed.error.issues }, { status: 400 });
  const o = parsed.data;

  // Se paga por MB WAY, o número de telemóvel português tem de ser válido (9 dígitos a começar em 9).
  if (o.paymentMethod === "mbway" && !/^(\+351)?\s?9\d{2}\s?\d{3}\s?\d{3}$/.test(o.phone ?? "")) {
    return NextResponse.json({ error: "Indica um número de telemóvel MB WAY válido." }, { status: 400 });
  }

  // Liberta o stock que estava preso em encomendas Multibanco que ninguém pagou. Se isto falhar, a compra continua na mesma.
  await expireStaleOrders().catch((e) => console.error("expireStaleOrders", e));

  let conn: PoolConnection | undefined;
  try {
    // Pede uma ligação à base de dados e começa a transação.
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // PASSO 1) Para cada item: ler o preço e o stock atuais da base de dados, validar e reservar o stock.
    type Line = { kind: string; productId?: number; ticketTypeId?: number; name: string; details: string; unit: number; qty: number; start?: string; days?: number; merch: boolean };
    const lines: Line[] = [];

    // Trancamos as linhas SEMPRE pela mesma ordem (artigos por id, depois bilhetes por id).
    // Se duas pessoas trancassem os mesmos artigos por ordens diferentes, a base de dados
    // ficava num impasse (deadlock, como duas pessoas à porta que não se deixam passar) e uma compra falhava.
    const lockKey = (it: (typeof o.items)[number]) => (it.kind === "bilhete" ? [1, it.ticketTypeId] : [0, it.productId]);
    const ordered = [...o.items].sort((a, b) => lockKey(a)[0] - lockKey(b)[0] || lockKey(a)[1] - lockKey(b)[1]);

    // Percorre os itens um a um.
    for (const it of ordered) {
      // CASO A: é um bilhete de evento.
      if (it.kind === "bilhete") {
        const [rows] = await conn.query<RowDataPacket[]>(
          `SELECT t.*, e.name AS event_name, e.starts_at FROM ticket_types t JOIN events e ON e.id = t.event_id WHERE t.id = ? FOR UPDATE`,
          [it.ticketTypeId],
        );
        const t = rows[0];
        // O bilhete já não existe? Há menos bilhetes do que os pedidos? Então a compra falha com uma mensagem clara.
        if (!t) throw new OrderError("Um dos bilhetes já não existe.");
        if (t.stock < it.quantity) throw new OrderError(`Não há bilhetes suficientes: ${t.event_name} — ${t.name}.`);
        // Reserva os bilhetes (tira do stock) e guarda a linha para a encomenda.
        await conn.query("UPDATE ticket_types SET stock = stock - ? WHERE id = ?", [it.quantity, t.id]);
        lines.push({ kind: "bilhete", ticketTypeId: t.id, name: t.event_name, details: t.name, unit: t.price_cents, qty: it.quantity, merch: false });
        continue; // passa já ao item seguinte
      }

      // CASO B: é um produto (compra ou aluguer). Lemos o produto e trancamo-lo.
      const [rows] = await conn.query<RowDataPacket[]>("SELECT * FROM products WHERE id = ? FOR UPDATE", [it.productId]);
      const p = rows[0];
      if (!p) throw new OrderError("Um dos artigos já não existe.");
      if (p.stock < it.quantity) throw new OrderError(`Stock insuficiente: ${p.name}.`);

      if (it.kind === "aluguer") {
        // Aluguer: confere que o jogo se pode alugar e que a data de levantamento ainda não passou.
        if (p.rent_cents_per_day == null) throw new OrderError(`${p.name} não está disponível para aluguer.`);
        if (new Date(`${it.startDate}T23:59:59`) < new Date()) throw new OrderError("A data de levantamento já passou.");
        // O preço do aluguer é o preço por dia × o número de dias.
        lines.push({
          kind: "aluguer", productId: p.id, name: p.name, details: `${it.days} dias a partir de ${it.startDate}`,
          unit: p.rent_cents_per_day * it.days, qty: it.quantity, start: it.startDate, days: it.days, merch: false,
        });
      } else {
        // Compra: o preço é o da base de dados já com o desconto aplicado.
        const unit = Math.round(p.price_cents * (1 - p.discount_percent / 100));
        lines.push({ kind: "compra", productId: p.id, name: p.name, details: it.size ? `Tamanho ${it.size}` : "", unit, qty: it.quantity, merch: p.type === "merch" });
      }
      // O stock desce tanto na compra como no aluguer (o exemplar sai da loja).
      await conn.query("UPDATE products SET stock = stock - ? WHERE id = ?", [it.quantity, p.id]);
    }

    // PASSO 2) O merch vai por correio, por isso exige morada e código postal (formato 0000-000).
    const hasMerch = lines.some((l) => l.merch);
    if (hasMerch && (!o.details.address || !/^\d{4}-\d{3}$/.test(o.details.postalCode) || !o.details.city)) {
      throw new OrderError("Falta a morada de entrega do merch.");
    }

    // PASSO 3) Código promocional: tem de estar ativo, não ter expirado e ter utilizações livres.
    //    Se não for válido, simplesmente não há desconto (a compra continua). A linha fica trancada (FOR UPDATE)
    //    para duas pessoas não gastarem a última utilização ao mesmo tempo.
    let percentOff = 0;
    if (o.promoCode) {
      const [promo] = await conn.query<RowDataPacket[]>(
        `SELECT percent_off FROM promo_codes
         WHERE code = ? AND active = TRUE
           AND (expires_at IS NULL OR expires_at > NOW())
           AND (max_uses IS NULL OR uses < max_uses)
         FOR UPDATE`,
        [o.promoCode],
      );
      if (promo[0]) {
        percentOff = promo[0].percent_off;
        // Gasta uma utilização do código.
        await conn.query("UPDATE promo_codes SET uses = uses + 1 WHERE code = ?", [o.promoCode]);
      }
    }

    // PASSO 4) Calcula os totais, sempre em cêntimos (a conta está em src/lib/pricing.ts).
    const { subtotal, discount, shipping, total } = orderTotals(lines, percentOff, hasMerch);

    // PASSO 5) Pagamento simulado:
    //    - Multibanco fica "pendente" até o trabalhador marcar como pago;
    //    - MB WAY e cartão ficam logo "pago".
    //    A referência Multibanco é gerada com `randomInt` (aleatório seguro; o `Math.random` é previsível).
    const status = o.paymentMethod === "multibanco" ? "pendente" : "pago";
    const ref =
      o.paymentMethod === "multibanco"
        ? `Ent. 21234 · Ref. ${String(randomInt(100_000_000, 1_000_000_000)).replace(/(\d{3})(?=\d)/g, "$1 ")}`
        : o.paymentMethod === "mbway"
          ? `MB WAY ${o.phone}`
          : "Cartão (simulado)";

    // PASSO 6) Grava a encomenda e as suas linhas, e confirma a transação (só agora fica tudo guardado a sério).
    const [res] = await conn.query<ResultSetHeader>(
      `INSERT INTO orders (user_id, status, contact_name, contact_email, address, postal_code, city, payment_method,
        payment_ref, promo_code, subtotal_cents, discount_cents, shipping_cents, total_cents)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(session.user.id), status, o.details.name, o.details.email,
        hasMerch ? o.details.address : null, hasMerch ? o.details.postalCode : null, hasMerch ? o.details.city : null,
        o.paymentMethod, ref, percentOff ? o.promoCode : null, subtotal, discount, shipping, total,
      ],
    );

    // Grava, de uma só vez, todas as linhas (artigos) desta encomenda.
    await conn.query(
      `INSERT INTO order_items (order_id, kind, product_id, ticket_type_id, name, details, unit_price_cents, quantity, rental_start, rental_days) VALUES ?`,
      [lines.map((l) => [res.insertId, l.kind, l.productId ?? null, l.ticketTypeId ?? null, l.name, l.details, l.unit, l.qty, l.start ?? null, l.days ?? null])],
    );

    await conn.commit();
    return NextResponse.json({ id: res.insertId, status, total, paymentRef: ref });
  } catch (err) {
    // Algo falhou: desfaz TUDO o que a transação tinha feito (o stock volta ao que era).
    await conn?.rollback();
    // Erro do negócio (ex.: sem stock): responde 409 com a mensagem para o cliente perceber.
    if (err instanceof OrderError) return NextResponse.json({ error: err.message }, { status: 409 });
    // Erro inesperado: regista-o no servidor e responde com uma mensagem genérica (sem detalhes técnicos).
    console.error(err);
    return NextResponse.json({ error: "Não foi possível concluir a encomenda." }, { status: 500 });
  } finally {
    // Aconteça o que acontecer, devolve a ligação ao "pool".
    conn?.release();
  }
}
