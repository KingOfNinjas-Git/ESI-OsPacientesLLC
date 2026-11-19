// FICHEIRO: auth.ts
// Aqui está o sistema de LOGIN (Auth.js, também chamado NextAuth v5).
// Funciona com email + palavra-passe guardados no MySQL.
//
// Este ficheiro dá-nos 4 coisas:
//   - auth()     → diz quem está com sessão iniciada (em páginas do servidor e server actions)
//   - signIn()   → inicia sessão (usado em server/actions/auth.ts)
//   - signOut()  → termina sessão
//   - handlers   → as rotas /api/auth/* (ver app/api/auth/[...nextauth]/route.ts)
//
// A sessão fica num cookie (JWT) e leva o id, o primeiro nome e o papel da pessoa (ver auth.config.ts).

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { query } from "@/server/db";
import type { Role } from "@/lib/types";

// Verificação rápida do que vem do formulário de login ANTES de ir à base de dados:
// o email tem de parecer um email e a palavra-passe não pode estar vazia.
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Começamos pela configuração base (a mesma que o middleware usa)...
  ...authConfig,
  // ...e acrescentamos a forma de fazer login: por email e palavra-passe.
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      // Esta função é chamada sempre que alguém tenta iniciar sessão.
      // Devolve o utilizador se o email e a palavra-passe estiverem certos, ou `null` (recusado).
      // As palavras-passe estão guardadas "baralhadas" (hash bcrypt), nunca em texto normal.
      async authorize(raw) {
        // 1) Confirma que o formulário veio com email e palavra-passe válidos. Se não, recusa.
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        // 2) Procura na base de dados o utilizador com aquele email (em minúsculas).
        const rows = await query<{
          id: number;
          email: string;
          password_hash: string;
          first_name: string;
          last_name: string;
          role: Role;
        }>("SELECT * FROM users WHERE email = ?", [parsed.data.email.toLowerCase()]);
        const user = rows[0];
        // 3) Se o utilizador não existe, ou a palavra-passe não bate com o hash guardado, recusa.
        if (!user || !(await bcrypt.compare(parsed.data.password, user.password_hash))) return null;
        // 4) Tudo certo! Devolve os dados da pessoa para ficarem na sessão.
        return {
          id: String(user.id),
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          firstName: user.first_name,
          role: user.role,
        };
      },
    }),
  ],
});
