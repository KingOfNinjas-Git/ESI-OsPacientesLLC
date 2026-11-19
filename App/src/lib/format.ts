// FICHEIRO: format.ts
// Aqui estão as funções que "embelezam" os números e as datas para o utilizador ler.
// Por baixo, o dinheiro é sempre guardado em CÊNTIMOS (números inteiros, ex.: 4499).
// Só na hora de mostrar no ecrã é que viram euros (ex.: "44,99 €").

// Cria um "formatador" de dinheiro em português de Portugal, em euros.
// Criamos só uma vez aqui em cima para não o estar a recriar de cada vez que é usado.
const euro = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });

// Recebe cêntimos e devolve texto em euros. Ex.: 4499 → "44,99 €"
export const formatEuro = (cents: number) => euro.format(cents / 100);

// Calcula o preço final de um artigo depois de tirar o desconto (%). Devolve cêntimos.
export const finalPrice = (p: { price_cents: number; discount_percent: number }) =>
  Math.round(p.price_cents * (1 - p.discount_percent / 100));

// Nomes curtos dos meses, pela ordem (janeiro é o 0, fevereiro é o 1, etc.).
const MONTHS = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];

// Transforma o que recebemos numa data a sério.
// Se vier um texto no formato "2026-11-14" (só dia, sem hora), lemos como se fosse meio-dia.
// Porquê? Porque à meia-noite, por causa do fuso horário, a data podia saltar para o dia anterior.
const toDate = (d: Date | string) => (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T12:00:00`) : new Date(d));

// Mete um zero à frente quando o número tem só um algarismo. Ex.: 7 → "07"
const pad = (n: number) => String(n).padStart(2, "0");

// Mostra só o dia. Ex.: "14 nov. 2026"
// (Fazemos à mão com a lista MONTHS para não depender do que o computador tem instalado.)
export const formatDate = (d: Date | string) => {
  const x = toDate(d);
  return `${x.getDate()} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`;
};

// Mostra só as horas e minutos. Ex.: "19:00"
export const formatTime = (d: Date | string) => {
  const x = toDate(d);
  return `${pad(x.getHours())}:${pad(x.getMinutes())}`;
};

// Junta o dia e a hora. Ex.: "14 nov. 2026 · 19:00"
export const formatDateTime = (d: Date | string) => `${formatDate(d)} · ${formatTime(d)}`;

// Dicionário: na base de dados a plataforma é "playstation" (tudo minúsculo),
// mas no ecrã queremos escrever "PlayStation". Isto faz essa tradução.
export const platformLabel: Record<string, string> = {
  playstation: "PlayStation",
  xbox: "Xbox",
  nintendo: "Nintendo",
  pc: "PC",
  tabuleiro: "Tabuleiro",
};

// Soma `days` dias a uma data "YYYY-MM-DD" e devolve outra data no mesmo formato.
// Usamos isto, por exemplo, para saber quando acaba um aluguer.
export function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  // O toISOString dá "2026-11-14T12:00:00.000Z"; ficamos só com os primeiros 10 caracteres (a data).
  return d.toISOString().slice(0, 10);
}

// Preço dos portes de envio do merch: 3,50 € (350 cêntimos).
// O carrinho usa isto para mostrar e o servidor usa para cobrar de verdade.
export const SHIPPING_CENTS = 350;
