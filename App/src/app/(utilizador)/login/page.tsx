// FICHEIRO: login/page.tsx
// A página de iniciar sessão ( /login ). Se a pessoa já tiver sessão, volta logo à página inicial.
// O `callbackUrl` é a página protegida que ela queria abrir antes de ser mandada para aqui
// (o middleware é que o acrescenta). Depois de fazer login, volta para essa página.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Iniciar sessão" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl } = await searchParams;
  // Já tem sessão? Não faz sentido ver o login: vai para a página inicial.
  if ((await auth())?.user) redirect("/");

  // O Auth.js manda um endereço completo (com http://...). Guardamos só o caminho (ex.: "/conta"),
  // assim ninguém nos consegue redirecionar para um site de fora.
  let path = "/";
  try {
    if (callbackUrl) {
      const u = new URL(callbackUrl, "http://local");
      path = u.pathname + u.search;
    }
  } catch {} // se o endereço for inválido, ignoramos e ficamos com "/"

  return (
    <AuthShell title="Iniciar sessão" showBack>
      <LoginForm callbackUrl={path} />
    </AuthShell>
  );
}
