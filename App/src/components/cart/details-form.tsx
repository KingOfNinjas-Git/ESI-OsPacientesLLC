// FICHEIRO: details-form.tsx
// O passo 2 da compra: "Os teus dados" (Figma "Carrinho — dados").
//
// Pede o nome e o email; se houver merch no carrinho, pede também a morada de entrega.
// Do lado direito mostra as datas de levantamento/devolução dos alugueres e os bilhetes.
// Ao continuar, valida os campos, guarda-os no carrinho (`setDetails`) e passa ao pagamento.
// Os dados ainda NÃO vão para o servidor aqui: só seguem junto com a encomenda no passo 3.
//
// "use client": corre no browser, porque tem campos de escrita e estado.

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "./cart-provider";
import { BackLink, CheckoutHeading, CheckoutSteps, primaryCta } from "./checkout-bits";
import { addDays, formatDate, formatEuro, SHIPPING_CENTS } from "@/lib/format";

// As classes de aspeto dos campos de escrita (guardadas aqui para não as repetir em todos).
// O `aria-invalid:border-destructive` pinta a borda de vermelho quando o campo tem erro.
const inputCls =
  "h-10 w-full rounded-sm border border-white/20 bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-brand-500 focus:outline-none aria-invalid:border-destructive";

// Um campo do formulário completo: título em cima, o campo no meio e a mensagem de erro por baixo (se houver).
function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-medium text-foreground">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

// O formulário em si. Recebe o nome e o email da conta para já vir preenchido.
export function DetailsForm({ defaultName, defaultEmail }: { defaultName: string; defaultEmail: string }) {
  const router = useRouter();
  const { items, ready, hasMerch, details, setDetails } = useCart();
  // `form` guarda o que a pessoa vai escrevendo. `errors` guarda as mensagens de erro de cada campo.
  const [form, setForm] = useState({ name: defaultName, email: defaultEmail, address: "", postalCode: "", city: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Se a pessoa já tinha preenchido os dados antes (e voltou atrás), repõe o que ela tinha escrito.
  useEffect(() => {
    if (details) setForm((f) => ({ ...f, ...details, name: details.name || f.name, email: details.email || f.email }));
  }, [details]);

  // Se o carrinho está vazio, não faz sentido estar aqui. Volta para o carrinho.
  useEffect(() => {
    if (ready && items.length === 0) router.replace("/carrinho");
  }, [ready, items.length, router]);

  // Separa os alugueres e os bilhetes, para mostrar informação sobre eles do lado direito.
  const rentals = items.filter((i) => i.kind === "aluguer");
  const tickets = items.filter((i) => i.kind === "bilhete");
  // Cria uma função para atualizar um campo concreto à medida que a pessoa escreve.
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  // Quando carregas em "Continuar": valida tudo no browser (para dar erros logo, sem esperar) e segue para o pagamento.
  // O servidor volta a validar mais tarde, por segurança.
  function submit(e: React.FormEvent) {
    // Impede o comportamento normal do formulário (recarregar a página).
    e.preventDefault();
    const err: Record<string, string> = {};
    // Vai acumulando os erros que encontrar, campo a campo.
    if (form.name.trim().length < 3) err.name = "Indica o nome completo.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = "E-mail inválido.";
    // A morada só é exigida se houver merch.
    if (hasMerch) {
      if (form.address.trim().length < 5) err.address = "Indica a morada.";
      if (!/^\d{4}-\d{3}$/.test(form.postalCode)) err.postalCode = "Formato 0000-000.";
      if (form.city.trim().length < 2) err.city = "Indica a localidade.";
    }
    setErrors(err);
    // Se houve algum erro, pára aqui e deixa a pessoa corrigir.
    if (Object.keys(err).length) return;
    // Tudo certo: guarda os dados no carrinho e segue para o pagamento.
    setDetails(form);
    router.push("/carrinho/pagamento");
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      <CheckoutHeading>Os teus dados</CheckoutHeading>
      <CheckoutSteps current={2} />
      <div className="pt-3">
        <BackLink href="/carrinho">Voltar ao carrinho</BackLink>
      </div>

      <div className="grid gap-10 pt-6 md:grid-cols-[455px_1fr] md:gap-12">
        {/* Coluna da esquerda: os campos para preencher. */}
        <div className="space-y-12">
          <section className="space-y-6">
            <h2 className="text-[17px] text-foreground">Dados de contacto</h2>
            <Field label="Nome completo *" error={errors.name}>
              <input className={inputCls} placeholder="Nome e apelido" value={form.name} onChange={set("name")} aria-invalid={!!errors.name} autoComplete="name" />
            </Field>
            <Field label="E-mail *" error={errors.email}>
              <input type="email" className={inputCls} placeholder="nome@exemplo.pt" value={form.email} onChange={set("email")} aria-invalid={!!errors.email} autoComplete="email" />
            </Field>
          </section>

          {/* Esta parte (morada) só aparece se houver merch no carrinho. */}
          {hasMerch && (
            <section className="space-y-5">
              <div>
                <h2 className="text-[17px] text-foreground">Entrega do merch</h2>
                <p className="mt-3 flex items-center gap-2 text-sm text-foreground">
                  <span className="grid size-3.5 place-items-center rounded-full border border-foreground">
                    <span className="size-2 rounded-full bg-spark" />
                  </span>
                  Envio para morada · {formatEuro(SHIPPING_CENTS)}
                </p>
              </div>
              <Field label="Morada *" error={errors.address}>
                <input className={inputCls} placeholder="Rua, número e andar" value={form.address} onChange={set("address")} aria-invalid={!!errors.address} autoComplete="street-address" />
              </Field>
              <div className="grid grid-cols-[150px_1fr] gap-4">
                <Field label="Código postal *" error={errors.postalCode}>
                  <input className={inputCls} placeholder="0000-000" value={form.postalCode} onChange={set("postalCode")} aria-invalid={!!errors.postalCode} autoComplete="postal-code" inputMode="numeric" />
                </Field>
                <Field label="Localidade *" error={errors.city}>
                  <input className={inputCls} placeholder="Localidade" value={form.city} onChange={set("city")} aria-invalid={!!errors.city} autoComplete="address-level2" />
                </Field>
              </div>
            </section>
          )}
          <p className="text-xs text-foreground">* Campos obrigatórios</p>
        </div>

        {/* Coluna da direita: informação sobre alugueres e bilhetes + botão de continuar. */}
        <div className="flex flex-col gap-12 text-sm text-foreground">
          {/* Só aparece se houver jogos alugados: diz quando levantar e devolver. */}
          {rentals.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-[17px]">Levantamento do jogo</h2>
              {rentals.map(
                (r) =>
                  r.kind === "aluguer" && (
                    <div key={r.key} className="space-y-3">
                      <p className="font-medium">
                        {r.name} · {r.days} {r.days === 1 ? "dia" : "dias"}
                      </p>
                      <p className="leading-5">
                        Levantar na loja: {formatDate(r.startDate)}
                        <br />
                        Devolver na loja: {formatDate(addDays(r.startDate, r.days))}
                      </p>
                    </div>
                  ),
              )}
              <p className="text-[13px] leading-5">
                Confirma o horário da loja
                <br />
                antes da deslocação.
              </p>
            </section>
          )}

          {/* Só aparece se houver bilhetes: diz o evento, a data e a quantidade. */}
          {tickets.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-[17px]">Bilhetes do evento</h2>
              {tickets.map(
                (t) =>
                  t.kind === "bilhete" && (
                    <div key={t.key} className="space-y-3">
                      <p className="font-medium">{t.eventName}</p>
                      <p className="leading-5">
                        {t.eventDate}
                        <br />
                        {t.quantity} × {t.name.toLowerCase()}
                      </p>
                    </div>
                  ),
              )}
              <p className="text-[13px] leading-5">
                Os bilhetes serão enviados
                <br />
                para o e-mail indicado.
              </p>
            </section>
          )}

          {/* O botão fica encostado ao fundo da coluna (mt-auto). */}
          <div className="mt-auto md:pl-0">
            <button type="submit" className={primaryCta}>
              Continuar para pagamento
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
