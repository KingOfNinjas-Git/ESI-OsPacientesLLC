// FICHEIRO: middleware.ts
// O middleware é um segurança à porta do site. Corre ANTES de cada pedido às páginas
// listadas em `config.matcher` (ali em baixo).
// Se a pessoa não tiver sessão iniciada, ou não tiver o papel certo para aquela página,
// é mandada embora (redirecionada). As regras estão em `PROTECTED`, no ficheiro src/server/auth.config.ts.

import NextAuth from "next-auth";
import { authConfig } from "./server/auth.config";

// Montamos o Auth.js com a nossa configuração e exportamos a parte que verifica a sessão (`auth`).
export default NextAuth(authConfig).auth;

// Lista das páginas onde o segurança vigia.
// Se criares uma página protegida nova, tens de a acrescentar AQUI e também em PROTECTED.
export const config = {
  matcher: ["/admin/:path*", "/trabalhador/:path*", "/conta/:path*", "/carrinho/dados", "/carrinho/pagamento"],
};
