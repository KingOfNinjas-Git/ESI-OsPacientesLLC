// FICHEIRO: orders.ts
// Aqui tratamos da "vida" de uma encomenda depois de ela ser criada: mudar o estado,
// cancelar (devolvendo o stock) e cancelar sozinhas as encomendas Multibanco que ninguém pagou.
//
// Porquê isto? Quando alguém compra, o stock desce logo. Se a pessoa nunca pagar o Multibanco,
// os jogos ficavam "presos" para sempre e ninguém mais os podia comprar.
//
// Regras:
//  - Cancelar uma encomenda devolve o stock de tudo o que ela tinha
//    e liberta o uso do código promocional.
//  - Uma encomenda cancelada não pode voltar a outro estado (o stock já foi devolvido
//    e pode já ter sido vendido a outra pessoa).
//  - Encomendas Multibanco pendentes há mais de PENDING_HOURS horas são canceladas.

import "server-only";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { pool } from "@/server/db";

// Os 3 estados possíveis de uma encomenda.
export type OrderStatus = "pendente" | "pago" | "cancelado";

// Quantas horas uma encomenda Multibanco pode ficar por pagar antes de ser cancelada.
export const PENDING_HOURS = 48;

// Devolve ao stock tudo o que a encomenda tinha reservado.
// Tem de ser chamada dentro de uma "transação" (ver mais abaixo o que é).
async function restock(conn: PoolConnection, orderId: number) {
  // Vê que artigos (e quantos) estavam nesta encomenda.
  const [items] = await conn.query<RowDataPacket[]>(
    "SELECT product_id, ticket_type_id, quantity FROM order_items WHERE order_id = ?",
    [orderId],
  );
  // Para cada artigo, soma de volta a quantidade ao stock.
  for (const it of items) {
    // Se for um produto, devolve ao stock de produtos.
    if (it.product_id) await conn.query("UPDATE products SET stock = stock + ? WHERE id = ?", [it.quantity, it.product_id]);
    // Se for um bilhete, devolve ao stock de bilhetes.
    if (it.ticket_type_id) await conn.query("UPDATE ticket_types SET stock = stock + ? WHERE id = ?", [it.quantity, it.ticket_type_id]);
  }
}

// Muda o estado de uma encomenda.
// Devolve `false` se não foi possível (a encomenda não existe, ou já estava cancelada).
export async function setOrderStatus(orderId: number, status: OrderStatus): Promise<boolean> {
  // Pedimos uma ligação só para nós, porque vamos usar uma "transação":
  // ou todas as alterações acontecem, ou nenhuma (nunca fica a meio).
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // Vai buscar a encomenda. O "FOR UPDATE" tranca a linha para ninguém a mexer ao mesmo tempo.
    const [rows] = await conn.query<RowDataPacket[]>("SELECT status, promo_code FROM orders WHERE id = ? FOR UPDATE", [orderId]);
    const order = rows[0];
    // Não existe ou já está cancelada? Desfaz tudo e diz que não deu.
    if (!order || order.status === "cancelado") {
      await conn.rollback();
      return false;
    }
    // Se vamos cancelar, devolvemos o stock e libertamos o código promocional.
    if (status === "cancelado") {
      await restock(conn, orderId);
      // GREATEST(..., 0) garante que o contador de usos nunca fica negativo.
      if (order.promo_code) await conn.query("UPDATE promo_codes SET uses = GREATEST(uses - 1, 0) WHERE code = ?", [order.promo_code]);
    }
    // Grava o novo estado e confirma a transação (agora sim, tudo fica guardado).
    await conn.query("UPDATE orders SET status = ? WHERE id = ?", [status, orderId]);
    await conn.commit();
    return true;
  } catch (err) {
    // Se algo correu mal, desfaz tudo o que tinha sido feito e volta a lançar o erro.
    await conn.rollback();
    throw err;
  } finally {
    // Aconteça o que acontecer, devolvemos a ligação ao "pool" para outros a usarem.
    conn.release();
  }
}

// Cancela as encomendas Multibanco que estão por pagar há mais de PENDING_HOURS horas.
// Devolve quantas foram canceladas.
export async function expireStaleOrders(): Promise<number> {
  // Procura as encomendas "velhas": pendentes, pagas por Multibanco e criadas há demasiado tempo.
  const [stale] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM orders WHERE status = 'pendente' AND payment_method = 'multibanco' AND created_at < NOW() - INTERVAL ? HOUR",
    [PENDING_HOURS],
  );
  // Cancela uma a uma e vai contando as que realmente foram canceladas.
  let n = 0;
  for (const o of stale) if (await setOrderStatus(o.id, "cancelado")) n++;
  return n;
}
