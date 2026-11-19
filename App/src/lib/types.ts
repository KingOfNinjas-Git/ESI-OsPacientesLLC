// FICHEIRO: types.ts
// Aqui definimos a "forma" dos dados que andam pelo site: como é um produto, um evento, um item do carrinho...
// Estes tipos servem tanto para o servidor como para o browser, por isso ficam numa pasta partilhada.
// Os nomes dos campos (ex.: `price_cents`) são iguais aos nomes das colunas nas tabelas
// de db/schema.sql, porque os dados vêm diretamente do MySQL assim.
// Tudo o que acaba em `_cents` está em cêntimos.

// Os 3 papéis que um utilizador pode ter (coluna `users.role`). Cada papel define o que a pessoa pode fazer.
export type Role = "cliente" | "trabalhador" | "administrador";

// As plataformas possíveis de um jogo. "tabuleiro" são os jogos de tabuleiro. O merch não tem plataforma.
export type Platform = "playstation" | "xbox" | "nintendo" | "pc" | "tabuleiro";

// Um artigo do catálogo (tabela `products`): pode ser um jogo (para comprar e/ou alugar) ou merch.
export interface Product {
  id: number;
  slug: string; // nome "bonito" para o endereço, ex.: "fifa-26"
  type: "jogo" | "merch";
  name: string;
  description: string;
  platform: Platform | null; // null quando é merch
  category: string | null;
  price_cents: number;
  rent_cents_per_day: number | null; // preço do aluguer por dia (null = não se pode alugar)
  discount_percent: number;
  stock: number; // quantas unidades há
  popularity: number;
  is_new: boolean;
  sizes: string[] | null; // tamanhos disponíveis (só para merch como t-shirts)
  color: string;
  // Imagem da capa. Se for null, mostramos uma "arte" gerada a partir da cor.
  image_url: string | null;
}

// Um tipo de bilhete de um evento, ex.: "Entrada geral" (tabela `ticket_types`).
export interface TicketType {
  id: number;
  event_id: number; // a que evento pertence
  name: string;
  description: string;
  price_cents: number;
  stock: number;
}

// Um evento temático da loja (tabela `events`).
export interface GameEvent {
  id: number;
  slug: string;
  name: string;
  tagline: string; // frase curta de apresentação
  description: string;
  program: string; // o programa do evento; cada linha é um ponto do programa
  starts_at: Date;
  ends_at: Date;
  location: string;
  capacity: number; // lotação máxima
  min_age: number; // idade mínima
  featured: boolean; // true = aparece em destaque
  organizers: { label: string; value: string }[];
  color: string;
}

// Um evento já acompanhado da lista dos seus bilhetes (é um GameEvent + `tickets`).
export interface GameEventWithTickets extends GameEvent {
  tickets: TicketType[];
}

// Um item do carrinho (fica guardado no browser). O servidor volta a conferir os preços no fim, por segurança.
//
// Há três tipos de item, e o campo `kind` diz qual é:
//   - "compra":  um jogo ou merch comprado (o merch pode ter `size`, o tamanho)
//   - "aluguer": um jogo alugado a partir de `startDate` durante `days` dias
//   - "bilhete": um bilhete para um evento
// `key` é o "bilhete de identidade" do item no carrinho: se adicionares outra vez o mesmo `key`,
// não aparece uma linha nova, só aumenta a quantidade.
export type CartItem =
  | {
      key: string;
      kind: "compra";
      productId: number;
      name: string;
      productType: "jogo" | "merch";
      unitCents: number;
      quantity: number;
      size?: string;
      color: string;
      image?: string | null;
    }
  | {
      key: string;
      kind: "aluguer";
      productId: number;
      name: string;
      unitCents: number; // preço total do aluguer (dias × preço por dia)
      perDayCents: number;
      startDate: string; // formato YYYY-MM-DD
      days: number;
      quantity: number;
      color: string;
      image?: string | null;
    }
  | {
      key: string;
      kind: "bilhete";
      ticketTypeId: number;
      eventName: string;
      eventDate: string;
      name: string; // nome do tipo de bilhete
      unitCents: number;
      quantity: number;
      color: string;
    };
