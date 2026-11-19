// FICHEIRO: payment-form.tsx
// O passo 3 da compra: o Pagamento (Figma "Carrinho — pagamento").
//
// O cliente escolhe MB WAY, Multibanco ou cartão, aceita os termos e carrega em "Pagar".
// Nessa altura o carrinho é enviado para POST /api/orders, que confirma os preços e o stock
// e cria a encomenda. Se correr bem, o carrinho é esvaziado e abre a página de confirmação.
// Se correr mal, mostramos o erro que o servidor devolveu.
//
// O PAGAMENTO É SIMULADO: os dados do cartão só são verificados no formato
// e nunca são enviados nem guardados.
//
// "use client": corre no browser, porque tem campos, botões e estado.

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { discountFor, useCart } from "./cart-provider";
import { BackLink, CheckoutHeading, CheckoutSteps, itemEyebrow, primaryCta } from "./checkout-bits";
import { addDays, formatDate, formatEuro } from "@/lib/format";
import { cn } from "@/lib/utils";

// As 3 formas de pagamento possíveis.
type Method = "mbway" | "multibanco" | "cartao";

// As classes de aspeto dos campos de escrita.
const inputCls =
  "h-10 w-full rounded-sm border border-white/20 bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-brand-500 focus:outline-none";

export function PaymentForm() {
  const router = useRouter();
  const { items, ready, subtotal, shipping, hasMerch, promo, details, clear } = useCart();
  // O estado do formulário:
  //   method     → forma de pagamento escolhida
  //   phone      → telemóvel do MB WAY
  //   card       → dados do cartão
  //   terms      → aceitou os termos?
  //   error      → mensagem de erro a mostrar (se houver)
  //   submitting → true enquanto o pagamento está a ser processado
  const [method, setMethod] = useState<Method>("mbway");
  const [phone, setPhone] = useState("");
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "" });
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Proteção para ninguém ficar nesta página sem motivo:
  // sem itens → volta ao carrinho; sem os dados do passo 2 → volta aos dados.
  useEffect(() => {
    if (!ready || submitting) return;
    if (items.length === 0) router.replace("/carrinho");
    else if (!details) router.replace("/carrinho/dados");
  }, [ready, items.length, details, router, submitting]);

  // Contas finais: desconto e total a pagar.
  const discount = discountFor(subtotal, promo?.percentOff);
  const total = subtotal - discount + shipping;

  // Quando carregas em "Pagar": valida o formulário e envia a encomenda ao servidor.
  async function pay(e: React.FormEvent) {
    // Impede o comportamento normal do formulário (recarregar a página).
    e.preventDefault();
    setError(null);
    // Verificação 1: tem de aceitar os termos.
    if (!terms) return setError("Tens de aceitar os termos e condições.");
    // Verificação 2: se escolheu cartão, o número, validade (MM/AA) e CVC têm de ter o formato certo.
    if (method === "cartao" && (card.number.replace(/\s/g, "").length < 13 || !/^\d{2}\/\d{2}$/.test(card.expiry) || card.cvc.length < 3)) {
      return setError("Verifica os dados do cartão.");
    }
    // Tudo bem: marca como "a processar" (isto desativa o botão para não carregarem duas vezes).
    setSubmitting(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Só se enviam ids, quantidades e opções — NUNCA preços (o servidor vai lê-los à base de dados).
      body: JSON.stringify({
        items: items.map((i) =>
          i.kind === "bilhete"
            ? { kind: i.kind, ticketTypeId: i.ticketTypeId, quantity: i.quantity }
            : i.kind === "aluguer"
              ? { kind: i.kind, productId: i.productId, quantity: i.quantity, startDate: i.startDate, days: i.days }
              : { kind: i.kind, productId: i.productId, quantity: i.quantity, size: i.size },
        ),
        details,
        paymentMethod: method,
        phone: method === "mbway" ? phone : undefined,
        promoCode: promo?.code,
        acceptTerms: true,
      }),
    });
    // Lê a resposta do servidor (se vier estragada, usa um objeto vazio).
    const data = await res.json().catch(() => ({}));
    // Se o servidor recusou, volta a ativar o botão e mostra o erro.
    if (!res.ok) {
      setSubmitting(false);
      return setError(data.error ?? "Ocorreu um erro. Tenta novamente.");
    }
    // Correu bem: esvazia o carrinho e vai para a página de confirmação.
    clear();
    router.push(`/carrinho/confirmado?id=${data.id}`);
  }

  // A lista de formas de pagamento para desenhar os botões.
  const options: { id: Method; label: string }[] = [
    { id: "mbway", label: "MB WAY" },
    { id: "multibanco", label: "Multibanco" },
    { id: "cartao", label: "Cartão" },
  ];

  return (
    <form onSubmit={pay} className="space-y-3">
      <CheckoutHeading>Pagamento</CheckoutHeading>
      <CheckoutSteps current={3} />
      <div className="pt-3">
        <BackLink href="/carrinho/dados">Voltar aos dados</BackLink>
      </div>

      <div className="grid gap-10 pt-2 md:grid-cols-[455px_1fr] md:gap-6">
        {/* Coluna da esquerda: escolher como pagar. */}
        <div className="space-y-5 pt-6">
          <h2 className="text-[19px] text-foreground">Como queres pagar?</h2>
          <div role="radiogroup" aria-label="Método de pagamento" className="space-y-4">
            {/* Um botão para cada forma de pagamento. O escolhido fica destacado a roxo. */}
            {options.map((o) => (
              <button
                type="button"
                role="radio"
                aria-checked={method === o.id}
                key={o.id}
                onClick={() => setMethod(o.id)}
                className={cn(
                  "flex h-[43px] w-full items-center gap-2 rounded-sm border px-4 text-left text-sm text-foreground transition",
                  method === o.id ? "border-brand-500 bg-brand-500/20" : "border-white/20 bg-card hover:bg-white/5",
                )}
              >
                <span className="grid size-3.5 place-items-center rounded-full border border-foreground">
                  {method === o.id && <span className="size-2 rounded-full bg-spark" />}
                </span>
                {o.label}
              </button>
            ))}
          </div>

          {/* Campos extra conforme a forma de pagamento escolhida. */}
          {/* MB WAY: pede o telemóvel. */}
          {method === "mbway" && (
            <div className="space-y-4 pt-3">
              <label className="block">
                <span className="mb-2 block text-[13px] font-medium text-foreground">Telemóvel MB WAY *</span>
                <input className={inputCls} required inputMode="tel" placeholder="+351 9xx xxx xxx" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
              </label>
              <p className="text-sm leading-5 text-foreground">
                Receberás um pedido na app MB WAY
                <br />
                para autorizar o pagamento.
              </p>
            </div>
          )}
          {/* Multibanco: só explica o que vai acontecer. */}
          {method === "multibanco" && (
            <p className="pt-3 text-sm leading-5 text-foreground">
              Depois de confirmares, mostramos a entidade e a referência
              <br />
              para pagares num terminal Multibanco ou no homebanking.
            </p>
          )}
          {/* Cartão: pede número, validade e CVC. */}
          {method === "cartao" && (
            <div className="grid grid-cols-2 gap-4 pt-3">
              <label className="col-span-2 block">
                <span className="mb-2 block text-[13px] font-medium text-foreground">Número do cartão *</span>
                <input className={inputCls} inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-2 block text-[13px] font-medium text-foreground">Validade *</span>
                <input className={inputCls} autoComplete="cc-exp" placeholder="MM/AA" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-2 block text-[13px] font-medium text-foreground">CVC *</span>
                <input className={inputCls} inputMode="numeric" autoComplete="cc-csc" placeholder="123" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} />
              </label>
              <p className="col-span-2 text-xs text-muted-foreground">Pagamento simulado — os dados do cartão não são guardados nem enviados.</p>
            </div>
          )}

          {/* A caixinha para aceitar os termos e condições. */}
          <label className="flex items-start gap-3 pt-6 text-[13px] leading-5 text-foreground">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 size-[18px] accent-brand-500" />
            <span>
              Aceito os termos e condições e
              <br />
              as condições de aluguer do jogo. *
            </span>
          </label>
          <p className="text-xs text-foreground">* Campos obrigatórios</p>
        </div>

        <div className="space-y-6">
          {/* Coluna da direita: o resumo do pedido. */}
          <aside className="space-y-4 rounded-sm bg-white/[0.06] p-4 text-foreground">
            <h2 className="text-[19px]">Resumo do pedido</h2>
            {/* Uma linha por cada artigo. */}
            {items.map((i) => (
              <div key={i.key} className="space-y-1">
                <p className="text-[11px] font-medium tracking-wide uppercase">{itemEyebrow(i)}</p>
                <p className="text-sm">
                  {i.kind === "bilhete" ? i.eventName : i.name}
                  {i.kind === "compra" && i.size ? ` · ${i.size}` : ""} · {i.quantity} × {formatEuro(i.unitCents)}
                </p>
                {/* Para alugueres, mostra também as datas. */}
                {i.kind === "aluguer" && (
                  <p className="text-[11px]">
                    {formatDate(i.startDate)} – {formatDate(addDays(i.startDate, i.days))} · levantamento na loja
                  </p>
                )}
              </div>
            ))}
            {/* As contas: subtotal, desconto (se houver) e portes (se houver). */}
            <div className="space-y-2 border-t border-white/20 pt-4 text-[13px]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatEuro(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-brand-300">
                  <span>Desconto ({promo?.code})</span>
                  <span>-{formatEuro(discount)}</span>
                </div>
              )}
              {hasMerch && (
                <div className="flex justify-between">
                  <span>Envio de merch</span>
                  <span>{formatEuro(shipping)}</span>
                </div>
              )}
            </div>
            {/* O total a pagar. */}
            <div className="border-t border-white/20 pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[17px] font-medium">Total a pagar</span>
                <span className="text-[19px] font-semibold">{formatEuro(total)}</span>
              </div>
              <p className="mt-2 text-[11px]">IVA incluído</p>
            </div>
          </aside>

          {/* Se houver um erro, mostra-o numa caixinha vermelha. */}
          {error && (
            <p role="alert" className="rounded-sm border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          {/* O botão de pagar. Fica desativado enquanto processa, para ninguém pagar duas vezes. */}
          <button type="submit" disabled={submitting || !ready} className={primaryCta}>
            {submitting ? "A processar…" : `Pagar ${formatEuro(total)}`}
          </button>
          <p className="text-xs leading-5 text-foreground">
            Receberás a confirmação por e-mail.
            <br />
            <br />
            Os bilhetes do evento seguem
            <br />
            para o mesmo e-mail.
          </p>
        </div>
      </div>
    </form>
  );
}
