// FICHEIRO: db.ts
// Aqui fica a ligação à base de dados MySQL. Qualquer ida à base de dados passa por este ficheiro:
//   - query()   → para LER dados (SELECT)
//   - execute() → para ESCREVER dados (INSERT / UPDATE / DELETE)
// A morada, o utilizador e a palavra-passe da base de dados vêm das variáveis DB_* do ficheiro `.env.local`.
//
// O `import "server-only"` faz o build falhar se alguém importar isto num componente do browser.
// Assim as palavras-passe da base de dados nunca vão parar ao computador do utilizador.
//
// REGRA IMPORTANTE: usa SEMPRE `?` para meter valores no SQL e nunca juntes texto à mão.
// Isto evita "SQL injection" (alguém escrever código malicioso num campo e estragar a base de dados):
//   query("SELECT * FROM products WHERE slug = ?", [slug])

import "server-only";
import mysql from "mysql2/promise";

// Em desenvolvimento, o Next.js recarrega o código a toda a hora (hot-reload).
// Guardamos o "pool" numa variável global para não abrir ligações novas de cada vez.
declare global {
  var __gamehavenPool: mysql.Pool | undefined;
}

// O "pool" é um conjunto de ligações à base de dados que ficam abertas e são reutilizadas
// (é mais rápido do que abrir uma ligação nova a cada pedido).
// Se já existir um guardado, usamos esse; senão criamos um novo.
export const pool =
  globalThis.__gamehavenPool ??
  mysql.createPool({
    host: process.env.DB_HOST ?? "127.0.0.1", // onde está a base de dados
    port: Number(process.env.DB_PORT ?? 3306), // a "porta" de entrada do MySQL
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "gamehaven",
    connectionLimit: 10, // no máximo 10 ligações ao mesmo tempo
    dateStrings: false, // devolve datas como objetos Date e não como texto
    timezone: "local", // usa o fuso horário do computador
  });

// Fora de produção, guardamos o pool na variável global (ver comentário lá em cima).
if (process.env.NODE_ENV !== "production") globalThis.__gamehavenPool = pool;

// Para LER dados (SELECT). Devolve a lista de linhas encontradas, já com o tipo `T` que indicares.
export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

// Para ESCREVER dados (INSERT/UPDATE/DELETE).
// Devolve informação útil, como `insertId` (o id da linha criada) e `affectedRows` (quantas linhas mudaram).
export async function execute(sql: string, params: unknown[] = []): Promise<mysql.ResultSetHeader> {
  const [res] = await pool.query<mysql.ResultSetHeader>(sql, params);
  return res;
}
