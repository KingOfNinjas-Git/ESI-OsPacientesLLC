// FICHEIRO: auth.config.ts
// Aqui definimos QUEM pode entrar em QUE parte do site, e a configuração base do login.
// Este ficheiro NÃO pode usar a base de dados nem o bcrypt, porque o middleware também o carrega
// e o middleware corre num ambiente limitadinho (edge). A parte que usa a base de dados está em server/auth.ts.

import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/lib/types";

// A lista de áreas protegidas. Cada linha diz: "páginas que começam por X só aceitam estes papéis".
export const PROTECTED: { prefix: string; roles: Role[] }[] = [
  { prefix: "/admin", roles: ["administrador"] },
  { prefix: "/trabalhador", roles: ["trabalhador", "administrador"] },
  { prefix: "/conta", roles: ["cliente", "trabalhador", "administrador"] },
  { prefix: "/carrinho/dados", roles: ["cliente", "trabalhador", "administrador"] },
  { prefix: "/carrinho/pagamento", roles: ["cliente", "trabalhador", "administrador"] },
];

// A configuração partilhada entre o login e o middleware.
export const authConfig = {
  // Se alguém precisar de fazer login, é mandado para a página /login.
  pages: { signIn: "/login" },
  // A sessão fica guardada num cookie assinado (JWT) em vez de na base de dados.
  session: { strategy: "jwt" },
  // Vazio aqui de propósito: o login por email e palavra-passe é acrescentado em server/auth.ts.
  providers: [],
  callbacks: {
    // O "segurança": decide se o pedido pode continuar.
    //  - página sem regra       → entra qualquer pessoa
    //  - sem sessão iniciada    → é mandada para o login
    //  - papel errado           → volta à página inicial
    authorized({ auth, request: { nextUrl } }) {
      // Procura uma regra cujo prefixo bata com a página que a pessoa quer abrir.
      const rule = PROTECTED.find((r) => nextUrl.pathname.startsWith(r.prefix));
      // Não há regra? Página livre.
      if (!rule) return true;
      const role = auth?.user?.role;
      if (!role) return false; // sem login: redireciona para /login?callbackUrl=...
      // Tem login mas o papel não serve para esta página: volta à página inicial.
      if (!rule.roles.includes(role)) return Response.redirect(new URL("/", nextUrl));
      // Passou em tudo.
      return true;
    },
    // Quando alguém faz login, copia o id, o papel e o primeiro nome para o token (o cookie).
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.firstName = user.firstName;
      }
      return token;
    },
    // Passa esses campos do token para `session.user`, que é o que `auth()` entrega às páginas.
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      session.user.firstName = token.firstName as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
