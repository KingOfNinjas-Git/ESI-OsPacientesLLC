// FICHEIRO: rate-limit.ts
// Isto é um "porteiro" que diz "calma, estás a pedir demasiadas vezes".
// Serve para travar abusos: alguém a tentar adivinhar palavras-passe no login,
// a adivinhar códigos promocionais, a criar mil contas de seguida, etc.
//
// Como funciona: contamos os pedidos de cada pessoa durante uma "janela" de tempo
// (ex.: 5 pedidos por minuto). Passou o limite? Bloqueia até a janela acabar.
//
// Limitação: a contagem fica na memória do servidor. Com um só servidor (o nosso caso)
// chega bem; com vários servidores já seria preciso Redis ou a base de dados.

// Um "balde" guarda quantos pedidos já foram feitos (`count`) e quando é que a contagem volta a zero (`resetAt`).
type Bucket = { count: number; resetAt: number };
// Um mapa (tipo uma agenda): para cada "chave" (ex.: "login:1.2.3.4") guardamos o balde dessa pessoa.
const buckets = new Map<string, Bucket>();

// Regista um pedido e diz se ainda está dentro do limite.
//  - key:      quem ou o quê estamos a limitar (ex.: "login:1.2.3.4")
//  - limit:    máximo de pedidos permitidos por janela
//  - windowMs: duração da janela, em milissegundos
//  - now:      a hora atual (só a mudamos nos testes)
// Devolve `ok: false` quando passou o limite, e `retryAfterSec` com os segundos de espera.
export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  // Se o mapa já tem demasiadas entradas, varremos as que já expiraram.
  // Assim a memória do servidor não enche para sempre.
  if (buckets.size > 5000) for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);

  // Vamos buscar o balde desta pessoa.
  let b = buckets.get(key);
  // Se não existe, ou se a janela anterior já acabou, começamos um balde novo a zeros.
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }
  // Conta este pedido.
  b.count++;
  // Se a contagem ainda não passou o limite está tudo ok.
  // O "retryAfterSec" diz quantos segundos faltam para a janela fechar (no mínimo 1).
  return { ok: b.count <= limit, retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) };
}

// Descobre o endereço IP de quem está a fazer o pedido (a "morada" do computador dele na internet).
// Quando há um proxy pelo meio, o IP verdadeiro vem no cabeçalho `x-forwarded-for`.
export function clientIp(h: Headers) {
  // Esse cabeçalho pode trazer vários IPs separados por vírgulas; queremos o primeiro.
  // Se não houver nada, tentamos `x-real-ip`; se também não houver, escrevemos "desconhecido".
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "desconhecido";
}

// Só serve para os testes: apaga todas as contagens para cada teste começar do zero.
export function resetRateLimits() {
  buckets.clear();
}
