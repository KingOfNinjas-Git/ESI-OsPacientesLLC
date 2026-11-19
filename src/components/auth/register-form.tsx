// FICHEIRO: register-form.tsx
// O formulário de registo (criar conta). Chama a ação `registerAction` (server/actions/auth.ts).
// Os erros de cada campo aparecem por baixo desse campo, e o que a pessoa escreveu é reposto.
//
// "use client": corre no browser, porque mostra o estado de envio e os erros.

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/server/actions/auth";
import { Field } from "./auth-shell";

export function RegisterForm() {
  // `state` é a resposta da ação, `action` liga-se ao formulário e `pending` é true enquanto envia.
  const [state, action, pending] = useActionState(registerAction, undefined);
  // `e` são os erros de cada campo e `v` são os valores que a pessoa escreveu (vazios se não houver nada).
  const e = state?.fieldErrors ?? {};
  const v = state?.values ?? {};
  return (
    // O `key` recria o formulário quando os valores mudam, para os campos ficarem com o que foi escrito.
    <form key={JSON.stringify(v)} action={action} className="space-y-4">
      <p className="text-xs text-foreground">
        Já tens conta?{" "}
        <Link href="/login" className="ml-2 font-bold hover:underline">
          Inicia sessão aqui
        </Link>
      </p>
      <Field label="Email" name="email" type="email" autoComplete="email" error={e.email} defaultValue={v.email} />
      <div className="grid grid-cols-[1fr_1fr] gap-6">
        <Field label="Nome" name="firstName" autoComplete="given-name" error={e.firstName} defaultValue={v.firstName} />
        <Field label="Sobrenome" name="lastName" autoComplete="family-name" error={e.lastName} defaultValue={v.lastName} />
      </div>
      <Field label="Palavra-passe" name="password" type="password" autoComplete="new-password" error={e.password} />
      <Field label="Confirmar Palavra-passe" name="confirm" type="password" autoComplete="new-password" error={e.confirm} />
      {/* Erro geral (ex.: "demasiadas tentativas"), se houver. */}
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="flex justify-center pt-16">
        {/* O botão fica desativado enquanto cria a conta e muda o texto para "A criar…". */}
        <button
          disabled={pending}
          className="chamfer h-[29px] min-w-[107px] px-4 font-display text-[13px] font-semibold text-white [--ch-fill:var(--brand-700)] [--cut:7px] hover:text-spark hover:[--ch-fill:var(--brand-500)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-60"
        >
          {pending ? "A criar…" : "Criar Conta"}
        </button>
      </div>
    </form>
  );
}
