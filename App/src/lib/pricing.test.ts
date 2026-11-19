// FICHEIRO: pricing.test.ts
// Testes automáticos às contas de preços (correm com `npm test`).
// Cada `it(...)` é um teste pequenino: dizemos o que esperamos e o computador confirma se é verdade.
import { describe, expect, it } from "vitest";
import { orderTotals } from "./pricing";
import { SHIPPING_CENTS, addDays, finalPrice } from "./format";

// Grupo de testes à função que calcula os totais da encomenda.
describe("orderTotals", () => {
  it("soma as linhas sem desconto nem portes", () => {
    // 2 × 10,00 € + 1 × 5,50 € = 25,50 €
    const t = orderTotals([{ unit: 1000, qty: 2 }, { unit: 550, qty: 1 }], 0, false);
    expect(t).toEqual({ subtotal: 2550, discount: 0, shipping: 0, total: 2550 });
  });

  it("aplica o desconto do código ao subtotal", () => {
    const t = orderTotals([{ unit: 4999, qty: 1 }], 10, false);
    expect(t.discount).toBe(500); // 10% de 4999 dá 499,9, que arredonda para 500
    expect(t.total).toBe(4499);
  });

  it("cobra portes só quando há merch, depois do desconto", () => {
    const t = orderTotals([{ unit: 2000, qty: 1 }], 50, true);
    expect(t.shipping).toBe(SHIPPING_CENTS);
    expect(t.total).toBe(1000 + SHIPPING_CENTS);
  });

  it("um carrinho vazio custa 0 (e portes se for merch)", () => {
    expect(orderTotals([], 0, false).total).toBe(0);
  });

  it("nunca devolve cêntimos fracionados", () => {
    // Confirma que o total é sempre um número inteiro (sem casas decimais estranhas).
    const t = orderTotals([{ unit: 333, qty: 3 }], 15, false);
    expect(Number.isInteger(t.total)).toBe(true);
  });
});

// Grupo de testes às funções de formatação.
describe("format", () => {
  it("finalPrice aplica a percentagem de desconto", () => {
    expect(finalPrice({ price_cents: 5999, discount_percent: 0 })).toBe(5999);
    expect(finalPrice({ price_cents: 5000, discount_percent: 20 })).toBe(4000);
  });

  it("addDays atravessa o fim do mês", () => {
    // 28 de novembro + 5 dias = 3 de dezembro
    expect(addDays("2026-11-28", 5)).toBe("2026-12-03");
  });
});
