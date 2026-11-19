// FICHEIRO: next-auth.d.ts
// O Auth.js (a biblioteca do login) não sabe que nós guardamos o `role` (papel), o `firstName` e o `id`
// na sessão. Aqui "ensinamos" isso ao TypeScript, para ele deixar escrever `session.user.role` sem se queixar.

import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/types";

declare module "next-auth" {
  // O utilizador que vem da base de dados ganha estes dois campos extra.
  interface User {
    role: Role;
    firstName: string;
  }
  // A sessão (quem está com login feito) tem sempre id, papel e primeiro nome,
  // além do que o Auth.js já traz de origem (nome, email, imagem...).
  interface Session {
    user: {
      id: string;
      role: Role;
      firstName: string;
    } & DefaultSession["user"];
  }
}
