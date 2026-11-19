// FICHEIRO: rate-limit.test.ts
// Testes automáticos ao "porteiro" que limita pedidos a mais (ver rate-limit.ts).
// Nos testes passamos a hora (o último número) à mão para controlarmos o tempo como quisermos.
import { beforeEach, describe, expect, it } from "vitest";
import { clientIp, rateLimit, resetRateLimits } from "./rate-limit";

// Antes de CADA teste, apagamos todas as contagens para um teste não estragar o seguinte.
beforeEach(() => resetRateLimits());

describe("rateLimit", () => {
  it("aceita até ao limite e recusa a seguir", () => {
    const t = 1_000;
    // O limite é 2: os dois primeiros pedidos passam...
    expect(rateLimit("a", 2, 60_000, t).ok).toBe(true);
    expect(rateLimit("a", 2, 60_000, t).ok).toBe(true);
    // ...e o terceiro é recusado, com 60 segundos de espera.
    const third = rateLimit("a", 2, 60_000, t);
    expect(third.ok).toBe(false);
    expect(third.retryAfterSec).toBe(60);
  });

  it("chaves diferentes não se afetam", () => {
    // Gastar o limite da pessoa "a" não pode prejudicar a pessoa "b".
    rateLimit("a", 1, 60_000, 0);
    expect(rateLimit("b", 1, 60_000, 0).ok).toBe(true);
  });

  it("volta a aceitar quando a janela termina", () => {
    rateLimit("a", 1, 1000, 0);
    expect(rateLimit("a", 1, 1000, 500).ok).toBe(false); // ainda dentro da janela: recusa
    expect(rateLimit("a", 1, 1000, 1001).ok).toBe(true); // a janela acabou: aceita outra vez
  });
});

describe("clientIp", () => {
  it("usa o primeiro IP de x-forwarded-for", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
  });
  it("tem valor por omissão", () => {
    // Sem cabeçalhos nenhuns, devolve "desconhecido".
    expect(clientIp(new Headers())).toBe("desconhecido");
  });
});
