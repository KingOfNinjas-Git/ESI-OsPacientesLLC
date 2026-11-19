// FICHEIRO: session.ts
// Aqui verificamos "quem és tu?" e "podes fazer isto?" dentro das páginas e das server actions.
// O middleware (src/middleware.ts) já bloqueia as páginas protegidas, mas as server actions
// podem ser chamadas diretamente por alguém mal-intencionado. Por isso cada uma volta a
// verificar o papel com `requireRole`. Cinto e suspensórios!

// "server-only" faz o build dar erro se este ficheiro for importado no browser (segurança).
import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import type { Role } from "@/lib/types";

// Garante que há sessão iniciada E que o papel da pessoa é um dos permitidos.
// Exemplo: `await requireRole("administrador")`. Devolve o utilizador se estiver tudo bem.
export async function requireRole(...roles: Role[]) {
  // Vai buscar a sessão atual (quem tem o login feito).
  const session = await auth();
  // Sem login? Manda para a página de login.
  if (!session?.user) redirect("/login");
  // Se indicámos papéis e o da pessoa não está na lista, manda para a página inicial.
  if (roles.length && !roles.includes(session.user.role)) redirect("/");
  // Chegou aqui, então pode passar. Devolvemos os dados dela.
  return session.user;
}
