// FICHEIRO: login-form.tsx
// O formulário de login. Chama a ação do servidor `loginAction` (server/actions/auth.ts).
// O `useActionState` guarda a resposta (os erros) e diz-nos se está a enviar (`pending`).
//
// "use client": corre no browser, porque mostra o estado de envio e os erros.

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/server/actions/auth";
import { Field } from "./auth-shell";

// `callbackUrl` é a página para onde ir depois de fazer login com sucesso.
export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  // `state` é a última resposta da ação (erros), `action` é a função a ligar ao formulário
  // e `pending` é true enquanto o login está a ser processado.
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    /* O `key` recria o formulário depois de um erro, para repor o email que a pessoa tinha escrito. */
    <form key={state?.values?.email} action={action} className="space-y-5 pt-6">
      {/* Campo escondido que leva o "para onde ir" até à ação do servidor. */}
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={state?.values?.email} />
      <Field label="Palavra-passe" name="password" type="password" autoComplete="current-password" />
      {/* Se houve erro (ex.: palavra-passe errada), mostra-o aqui. */}
      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="flex justify-center pt-4">
        {/* O botão fica desativado enquanto processa e muda o texto para "A entrar…". */}
        <button
          disabled={pending}
          className="chamfer h-[29px] min-w-[107px] px-4 font-display text-[13px] font-semibold text-white [--ch-fill:var(--brand-700)] [--cut:7px] hover:text-spark hover:[--ch-fill:var(--brand-500)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-60"
        >
          {pending ? "A entrar…" : "Iniciar sessão"}
        </button>
      </div>
      <p className="text-center text-xs text-foreground">
        Não tens conta?{" "}
        <Link href="/registar" className="font-bold hover:underline">
          Regista-te aqui
        </Link>
      </p>
    </form>
  );
}
