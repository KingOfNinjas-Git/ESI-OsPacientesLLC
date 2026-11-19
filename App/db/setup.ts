// FICHEIRO: db/setup.ts
// Este script prepara a base de dados: cria-a, aplica db/schema.sql (as tabelas) e insere dados de exemplo.
// Corre-se com: npm run db:setup
//
// ATENÇÃO: apaga todas as tabelas e volta a criá-las (perdem-se encomendas, contas novas, etc.).
// Serve para preparar uma base de dados de desenvolvimento ou de demonstração.
//
// Passos: 1) ligar ao MySQL  2) criar a base de dados e as tabelas  3) inserir utilizadores,
// produtos, eventos/bilhetes e códigos promocionais de exemplo.
import { config } from "dotenv";
// Lê as definições (palavra-passe da base de dados, etc.) dos ficheiros .env.local / .env.
config({ path: [".env.local", ".env"], quiet: true });
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

// As credenciais da base de dados, lidas do .env.local (as mesmas que o site usa).
// Os valores depois do "=" são os de reserva, usados se a variável não existir.
const {
  DB_HOST = "127.0.0.1",
  DB_PORT = "3306",
  DB_USER = "root",
  DB_PASSWORD = "",
  DB_NAME = "gamehaven",
} = process.env;

// Como é uma linha de produto de exemplo. A ordem dos campos é a mesma das colunas no INSERT mais abaixo.
// Os preços estão em cêntimos.
type Seed = [
  slug: string,
  type: "jogo" | "merch",
  name: string,
  description: string,
  platform: string | null,
  category: string,
  price: number,
  rentPerDay: number | null,
  discount: number,
  stock: number,
  popularity: number,
  isNew: boolean,
  sizes: string[] | null,
  color: string,
];

// O catálogo de exemplo: jogos de tabuleiro, jogos de consola/PC e merch da loja.
const products: Seed[] = [
  ["catan", "jogo", "Catan", "O clássico de troca e construção para 3–4 jogadores.", "tabuleiro", "Estratégia", 4499, 400, 0, 6, 95, false, null, "#7a3b12"],
  ["ticket-to-ride", "jogo", "Ticket to Ride", "Constrói rotas de comboio pela Europa.", "tabuleiro", "Família", 4799, 400, 15, 4, 80, false, null, "#1d4f8c"],
  ["carcassonne", "jogo", "Carcassonne", "Coloca peças e constrói cidades medievais.", "tabuleiro", "Família", 3299, 300, 0, 5, 70, false, null, "#3f6b2a"],
  ["dixit", "jogo", "Dixit", "Um jogo de imaginação e cartas ilustradas.", "tabuleiro", "Party", 3199, 300, 20, 3, 60, true, null, "#a8326e"],
  ["elden-ring", "jogo", "Elden Ring", "RPG de ação em mundo aberto.", "playstation", "RPG", 5999, 250, 25, 8, 98, false, null, "#5a4a1d"],
  ["gran-turismo-7", "jogo", "Gran Turismo 7", "Simulação de condução.", "playstation", "Corrida", 6999, 250, 0, 5, 75, false, null, "#0f3c78"],
  ["astro-bot", "jogo", "Astro Bot", "Plataformas cheio de cor e criatividade.", "playstation", "Plataformas", 6999, 250, 0, 7, 88, true, null, "#2b6fd6"],
  ["forza-horizon-5", "jogo", "Forza Horizon 5", "Corridas em mundo aberto no México.", "xbox", "Corrida", 5999, 250, 30, 4, 82, false, null, "#c2410c"],
  ["halo-infinite", "jogo", "Halo Infinite", "O regresso do Master Chief.", "xbox", "Shooter", 3999, 200, 0, 6, 65, false, null, "#2f5d3a"],
  ["starfield", "jogo", "Starfield", "Exploração espacial em grande escala.", "xbox", "RPG", 6999, 250, 0, 3, 55, true, null, "#1e293b"],
  ["mario-kart-8", "jogo", "Mario Kart 8 Deluxe", "Corridas para toda a família.", "nintendo", "Corrida", 5999, 250, 10, 10, 97, false, null, "#d62828"],
  ["zelda-totk", "jogo", "Zelda: Tears of the Kingdom", "Aventura épica em Hyrule.", "nintendo", "Aventura", 6999, 250, 0, 5, 93, false, null, "#2d6a4f"],
  ["smash-bros", "jogo", "Super Smash Bros. Ultimate", "O maior crossover de luta.", "nintendo", "Luta", 6999, 250, 0, 4, 85, false, null, "#9d0208"],
  ["baldurs-gate-3", "jogo", "Baldur's Gate 3", "RPG por turnos baseado em D&D.", "pc", "RPG", 5999, 250, 20, 6, 94, false, null, "#4a1d5a"],
  ["stardew-valley", "jogo", "Stardew Valley", "Vida na quinta, ao teu ritmo.", "pc", "Simulação", 1499, 100, 0, 12, 90, false, null, "#3a7d44"],
  ["hades-2", "jogo", "Hades II", "Roguelike mitológico.", "pc", "Ação", 2999, 150, 0, 7, 87, true, null, "#5b1020"],
  ["tshirt-loja", "merch", "T-shirt da loja", "T-shirt GameHaven em algodão orgânico.", null, "T-shirts", 1800, null, 0, 40, 70, false, ["S", "M", "L", "XL"], "#18063a"],
  ["hoodie-haven", "merch", "Hoodie Haven", "Hoodie com o globo GameHaven bordado.", null, "Hoodies", 4500, null, 15, 20, 66, true, ["S", "M", "L", "XL"], "#250663"],
  ["caneca-pixel", "merch", "Caneca Pixel", "Caneca de cerâmica, 350 ml.", null, "Acessórios", 1200, null, 0, 30, 50, false, null, "#3d1a8f"],
  ["tapete-rato", "merch", "Tapete de rato XL", "Tapete 90×40 cm com base antiderrapante.", null, "Acessórios", 2200, null, 10, 15, 45, false, null, "#2e1065"],
  ["bone-gamehaven", "merch", "Boné GameHaven", "Boné ajustável com logótipo.", null, "Acessórios", 1600, null, 0, 25, 40, false, null, "#1e1b4b"],
  ["dados-d20", "merch", "Conjunto de dados RPG", "Sete dados em resina para RPG de mesa.", null, "Acessórios", 1400, null, 0, 35, 58, true, null, "#6a3fd6"],
  ["poster-globo", "merch", "Poster Globo", "Poster A2 do globo GameHaven.", null, "Decoração", 900, null, 25, 50, 30, false, null, "#250663"],
  ["sacola-tote", "merch", "Saco Tote", "Saco em lona para levar os teus jogos.", null, "Acessórios", 1000, null, 0, 40, 35, false, null, "#18063a"],
];

// A função principal: faz a preparação completa da base de dados, passo a passo.
async function main() {
  // PASSO 1) Liga ao MySQL. O `multipleStatements` deixa-nos correr o schema.sql inteiro de uma só vez.
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });

  // PASSO 2) Cria a base de dados (se ainda não existir), seleciona-a e aplica o schema.sql (cria as tabelas).
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await conn.query(`USE \`${DB_NAME}\``);
  await conn.query(readFileSync(join(__dirname, "schema.sql"), "utf8"));
  console.log("✔ Esquema aplicado");

  // PASSO 3a) Utilizadores de demonstração: um de cada papel. A palavra-passe de todos é "gamehaven123"
  // (guardada baralhada, como sempre).
  const hash = await bcrypt.hash("gamehaven123", 10);
  await conn.query(
    "INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ?",
    [[
      ["cliente@gamehaven.pt", hash, "Carla", "Cliente", "cliente"],
      ["trabalhador@gamehaven.pt", hash, "Tomás", "Trabalhador", "trabalhador"],
      ["admin@gamehaven.pt", hash, "Ana", "Administradora", "administrador"],
    ]],
  );

  // PASSO 3b) Insere os produtos. Os tamanhos (lista) são convertidos para texto JSON antes de ir para a base de dados.
  await conn.query(
    `INSERT INTO products (slug, type, name, description, platform, category, price_cents,
      rent_cents_per_day, discount_percent, stock, popularity, is_new, sizes, color) VALUES ?`,
    [products.map((p) => [...p.slice(0, 12), p[12] ? JSON.stringify(p[12]) : null, p[13]])],
  );
  // Capas dos jogos: ficam em public/games/<slug>.jpg (fonte: Wikipedia). Só ligamos a imagem
  // se o ficheiro existir; os restantes (e o merch) usam a arte gerada a partir da cor.
  const withCover = products
    .filter(([slug, type]) => type === "jogo" && existsSync(join(__dirname, "..", "public", "games", `${slug}.jpg`)))
    .map(([slug]) => slug);
  if (withCover.length) {
    await conn.query("UPDATE products SET image_url = CONCAT('/games/', slug, '.jpg') WHERE slug IN (?)", [withCover]);
  }

  // PASSO 3c) Eventos de exemplo, com datas relativas a hoje (daqui a 3, 10 e 17 dias), para estarem sempre no futuro.
  const now = new Date();
  // Função auxiliar: devolve a data de "hoje + X dias" à hora indicada (h horas e m minutos).
  const at = (days: number, h: number, m = 0) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days, h, m);
    return d;
  };

  // A lista de eventos. Cada um tem os seus dados e a lista dos seus tipos de bilhete
  // (nome, descrição, preço em cêntimos, stock).
  const events = [
    {
      slug: "noite-de-jogos",
      name: "Noite de jogos",
      tagline: "Jogos de tabuleiro, torneios relâmpago e bar aberto",
      description:
        "Uma noite inteira dedicada aos jogos de tabuleiro. Traz os amigos ou conhece novos jogadores — a equipa GameHaven explica as regras de cada jogo.",
      program:
        "19:00 — Abertura de portas e escolha de mesas\n19:30 — Torneio relâmpago de Dixit\n21:00 — Mesas livres com a ludoteca completa\n23:00 — Sorteio de prémios e encerramento",
      starts: at(3, 19),
      ends: at(3, 23, 30),
      location: "GameHaven — Sala principal",
      capacity: 60,
      min_age: 12,
      featured: true,
      color: "#250663",
      organizers: [
        { label: "Organizador", value: "Equipa GameHaven" },
        { label: "Anfitrião", value: "Tomás Trabalhador" },
        { label: "Parceiro", value: "Associação Lúdica Local" },
        { label: "Contacto", value: "eventos@gamehaven.pt" },
        { label: "Telefone", value: "+351 210 000 000" },
        { label: "Instagram", value: "@gamehaven" },
      ],
      tickets: [
        ["Entrada geral", "Acesso a todas as mesas", 800, 50],
        ["Entrada + bebida", "Inclui uma bebida no bar", 1100, 30],
        ["Mesa reservada (4 pessoas)", "Mesa garantida para o grupo", 2800, 6],
      ],
    },
    {
      slug: "torneio-mario-kart",
      name: "Torneio Mario Kart",
      tagline: "Quem é o piloto mais rápido da cidade?",
      description:
        "Torneio por eliminatórias em Mario Kart 8 Deluxe. Inscrições individuais, prémios para o pódio.",
      program:
        "15:00 — Check-in dos jogadores\n15:30 — Fase de grupos\n17:30 — Meias-finais e final\n18:30 — Entrega de prémios",
      starts: at(10, 15),
      ends: at(10, 19),
      location: "GameHaven — Zona de consolas",
      capacity: 32,
      min_age: 8,
      featured: false,
      color: "#9d0208",
      organizers: [
        { label: "Organizador", value: "Equipa GameHaven" },
        { label: "Árbitro", value: "Ana Administradora" },
        { label: "Parceiro", value: "Clube de eSports" },
        { label: "Contacto", value: "eventos@gamehaven.pt" },
        { label: "Telefone", value: "+351 210 000 000" },
        { label: "Instagram", value: "@gamehaven" },
      ],
      tickets: [
        ["Inscrição jogador", "Participação no torneio", 1000, 32],
        ["Espectador", "Acesso à zona do público", 300, 40],
        ["Jogador + snack", "Inscrição e snack no bar", 1400, 16],
      ],
    },
    {
      slug: "retro-weekend",
      name: "Retro Weekend",
      tagline: "Consolas clássicas e reparações ao vivo",
      description:
        "Um fim de semana dedicado às consolas retro: jogos livres, oficina de reparação e mercado de troca.",
      program:
        "10:00 — Abertura e consolas livres\n14:00 — Oficina: limpar e reparar comandos\n17:00 — Mercado de trocas\n20:00 — Encerramento",
      starts: at(17, 10),
      ends: at(18, 20),
      location: "GameHaven — Todo o espaço",
      capacity: 120,
      min_age: 0,
      featured: false,
      color: "#3d1a8f",
      organizers: [
        { label: "Organizador", value: "Equipa GameHaven" },
        { label: "Oficina", value: "Serviço de reparação GameHaven" },
        { label: "Parceiro", value: "Museu do Videojogo" },
        { label: "Contacto", value: "eventos@gamehaven.pt" },
        { label: "Telefone", value: "+351 210 000 000" },
        { label: "Instagram", value: "@gamehaven" },
      ],
      tickets: [
        ["Passe 1 dia", "Acesso num dos dias", 600, 100],
        ["Passe fim de semana", "Acesso aos dois dias", 1000, 80],
        ["Oficina de reparação", "Lugar na oficina (inclui material)", 1500, 12],
      ],
    },
  ];

  // Insere cada evento e, logo a seguir, os seus tipos de bilhete, ligados pelo id que a base de dados deu ao evento (insertId).
  for (const e of events) {
    const [res] = await conn.query<mysql.ResultSetHeader>(
      `INSERT INTO events (slug, name, tagline, description, program, starts_at, ends_at,
        location, capacity, min_age, featured, organizers, color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [e.slug, e.name, e.tagline, e.description, e.program, e.starts, e.ends, e.location,
        e.capacity, e.min_age, e.featured, JSON.stringify(e.organizers), e.color],
    );
    await conn.query(
      "INSERT INTO ticket_types (event_id, name, description, price_cents, stock) VALUES ?",
      [e.tickets.map((t) => [res.insertId, ...t])],
    );
  }

  // PASSO 3d) Códigos promocionais de exemplo: HAVEN10 dá 10% e BEMVINDO dá 5%.
  await conn.query("INSERT INTO promo_codes (code, percent_off) VALUES ?", [[
    ["HAVEN10", 10],
    ["BEMVINDO", 5],
  ]]);

  // Mensagem final com as contas de teste disponíveis.
  console.log("✔ Dados de exemplo inseridos");
  console.log("  Contas (palavra-passe: gamehaven123):");
  console.log("  cliente@gamehaven.pt · trabalhador@gamehaven.pt · admin@gamehaven.pt");
  // Fecha a ligação à base de dados.
  await conn.end();
}

// Corre a função principal. Se algo falhar, mostra o erro e termina com código 1 (= falhou).
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
