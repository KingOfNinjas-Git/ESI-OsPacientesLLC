// FICHEIRO: api/promo/route.ts
// Verifica se um código promocional é válido (ex.: "BEMVINDO10").
import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { query } from "@/server/db";

// GET /api/promo?code=XYZ
// Um código só é válido se estiver ativo, não tiver expirado e ainda tiver utilizações livres
// (a mesma regra é aplicada quando a encomenda é criada, em /api/orders).
// Limitamos a 20 tentativas por minuto e por IP, para ninguém adivinhar códigos à força bruta.
export async function GET(req: Request) {
  // Contamos esta tentativa. Se a pessoa já passou das 20 num minuto, respondemos "429" (demasiados pedidos).
  const limit = rateLimit(`promo:${clientIp(req.headers)}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Demasiadas tentativas. Espera um pouco." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } });
  }

  // Lê o código do endereço, tira espaços e põe em maiúsculas (para "abc" e "ABC" serem o mesmo código).
  const code = new URL(req.url).searchParams.get("code")?.trim().toUpperCase();
  // Sem código nenhum? Erro 400 ("pedido mal feito").
  if (!code) return NextResponse.json({ error: "Indica um código." }, { status: 400 });
  // Procura na base de dados um código que esteja ativo, dentro do prazo e com utilizações disponíveis.
  const rows = await query<{ code: string; percent_off: number }>(
    `SELECT code, percent_off FROM promo_codes
     WHERE code = ? AND active = TRUE
       AND (expires_at IS NULL OR expires_at > NOW())
       AND (max_uses IS NULL OR uses < max_uses)`,
    [code],
  );
  // Não encontrou nada? Erro 404 ("não existe").
  if (!rows[0]) return NextResponse.json({ error: "Código inválido ou expirado." }, { status: 404 });
  // Encontrou! Devolve o código e a percentagem de desconto.
  return NextResponse.json({ code: rows[0].code, percentOff: rows[0].percent_off });
}
