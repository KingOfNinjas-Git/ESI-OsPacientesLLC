// FICHEIRO: auth-shell.tsx
// A moldura e o campo de texto partilhados pelas páginas de login e de registo.

import { Container, PageTitle } from "@/components/layout/page-title";
import { BackButton } from "./back-button";

// A moldura comum às páginas de "Autenticação" (Figma): título da página, botão "Voltar" opcional
// e uma caixa com o título do formulário e o conteúdo lá dentro.
export function AuthShell({ title, children, showBack }: { title: string; children: React.ReactNode; showBack?: boolean }) {
  return (
    <Container className="pb-24">
      <PageTitle>Autenticação</PageTitle>
      {/* Esta faixa reserva sempre o espaço do botão "Voltar", mesmo quando ele não aparece. */}
      <div className="h-11">{showBack && <BackButton />}</div>
      <section className="mx-auto mt-6 w-full max-w-[356px] border border-white/10 border-t-brand-500 border-t-2 bg-card px-6 pt-4 pb-6">
        <h2 className="mb-2 font-display text-xl font-bold text-foreground">{title}</h2>
        {children}
      </section>
    </Container>
  );
}

// Um campo de texto com título e mensagem de erro por baixo.
// É acessível: o `aria-invalid` e o `aria-describedby` avisam os leitores de ecrã de que há um erro.
export function Field({
  label,
  name,
  type = "text",
  error,
  autoComplete,
  className,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  error?: string;
  autoComplete?: string;
  className?: string;
  defaultValue?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-2 block font-display text-[13px] font-semibold text-foreground">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className="h-5 w-full rounded-full border border-white/15 bg-white/[0.06] px-3 text-sm text-foreground transition hover:border-brand-500/50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 focus:outline-none aria-invalid:border-destructive"
      />
      {/* A mensagem de erro, só se houver. */}
      {error && (
        <p id={`${name}-error`} className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
