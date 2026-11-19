// FICHEIRO: pricing.ts
// Aqui está a conta de quanto uma encomenda custa no total.
// É uma função "pura": recebe números, devolve números, e não mexe na base de dados
// nem na internet. Por isso é facílima de testar (ver pricing.test.ts).
// O servidor usa isto quando cria a encomenda (src/app/api/orders/route.ts).
// Regra de ouro do projeto: todos os valores estão em CÊNTIMOS (4499 = 44,99 €).

import { SHIPPING_CENTS } from "@/lib/format";

// Uma linha da encomenda: `unit` é o preço de 1 unidade e `qty` é quantas unidades levas.
export type PricedLine = { unit: number; qty: number };

// Faz a conta final: subtotal - desconto + portes.
//  - lines:      as linhas da encomenda (cada uma com preço e quantidade)
//  - percentOff: percentagem de desconto do código promocional (0 a 100)
//  - hasMerch:   true se levas merch (só o merch vai por correio e paga portes)
export function orderTotals(lines: PricedLine[], percentOff: number, hasMerch: boolean) {
  // Percorre as linhas todas e vai somando "preço × quantidade" (o 0 é o ponto de partida da soma).
  const subtotal = lines.reduce((sum, l) => sum + l.unit * l.qty, 0);
  // O desconto é uma percentagem do subtotal. O Math.round arredonda para não ficarmos com meio cêntimo.
  const discount = Math.round((subtotal * percentOff) / 100);
  // Se há merch pagas portes; se não há, os portes são zero.
  const shipping = hasMerch ? SHIPPING_CENTS : 0;
  // Devolvemos tudo junto, incluindo o total já calculado.
  return { subtotal, discount, shipping, total: subtotal - discount + shipping };
}
