// FICHEIRO: registar/page.tsx
// A página para criar conta ( /registar ). As contas novas são sempre de "cliente".

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Registar" };

export default async function RegistarPage() {
  // Quem já tem sessão não precisa de criar conta: vai para a página inicial.
  if ((await auth())?.user) redirect("/");
  return (
    <AuthShell title="Registar">
      <RegisterForm />
    </AuthShell>
  );
}
