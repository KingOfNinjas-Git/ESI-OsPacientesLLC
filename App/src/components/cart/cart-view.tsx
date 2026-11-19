// FICHEIRO: cart-view.tsx
// O passo 1 da compra: a lista do carrinho (Figma "Carrinho — jogos, merch e eventos").
//
// Para cada item mostra: imagem, tipo, nome, detalhes, alterar datas/tamanho, quantidade (+/−),
// subtotal e o botão de remover. Em baixo tem o código promocional e o resumo com o total.
// Se o carrinho estiver vazio, mostra ligações para a página dos Jogos e dos Eventos.
//
// "use client": corre no browser, porque tem botões, estado e animações.

"use client";

import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { discountFor, useCart } from "./cart-provider";
import { BackLink, CheckoutHeading, CheckoutSteps, itemEyebrow, primaryCta } from "./checkout-bits";
import { ArtPlaceholder } from "@/components/shop/art-placeholder";
import { addDays, formatDate, formatEuro } from "@/lib/format";
import type { CartItem } from "@/lib/types";

// Devolve as duas linhas de texto pequeno por baixo do nome do item. O texto muda conforme o tipo de item.
function describe(item: CartItem) {
  // O `switch` é um "se for isto faz aquilo, se for aquilo faz outra coisa" com vários casos.
  switch (item.kind) {
    // Aluguer: datas, número de dias e preço por dia.
    case "aluguer":
      return [
        `${formatDate(item.startDate)} – ${formatDate(addDays(item.startDate, item.days))} · ${item.days} ${item.days === 1 ? "dia" : "dias"} × ${formatEuro(item.perDayCents)}`,
        "Disponível · levantar e devolver na loja",
      ];
    // Bilhete: data do evento e tipo de bilhete.
    case "bilhete":
      return [`${item.eventDate} · na loja`, `${item.name} · ${formatEuro(item.unitCents)} / bilhete`];
    // Qualquer outro caso é uma compra: o texto depende de ser merch ou jogo.
    default:
      return item.productType === "merch"
        ? [`${item.size ? `Tamanho ${item.size} · ` : ""}${formatEuro(item.unitCents)} / un.`, "Em stock · envio para a tua morada"]
        : [`${formatEuro(item.unitCents)} / un.`, "Em stock · envio ou levantamento na loja"];
  }
}

// O pequeno editor que abre quando carregas em "Alterar datas" (aluguer: dia e número de dias,
// e o preço é recalculado) ou "Alterar opção" (merch: tamanho).
// `onDone` é a função que fecha o editor quando terminas.
function ItemEditor({ item, onDone }: { item: CartItem; onDone: () => void }) {
  const { update } = useCart();
  // Se é um aluguer, mostra o campo da data de levantamento e a lista de dias (1 a 14).
  if (item.kind === "aluguer") {
    return (
      <div className="mt-2 flex flex-wrap items-end gap-2 text-xs">
        <label className="flex flex-col gap-1">
          Levantar
          <input
            type="date"
            min={new Date().toISOString().slice(0, 10)} // não deixa escolher datas passadas
            value={item.startDate}
            onChange={(e) => update(item.key, { startDate: e.target.value })}
            className="h-8 rounded border bg-card px-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          Dias
          <select
            value={item.days}
            onChange={(e) => {
              // Ao mudar os dias, atualizamos também o preço total (preço por dia × dias).
              const days = Number(e.target.value);
              update(item.key, { days, unitCents: item.perDayCents * days });
            }}
            className="h-8 rounded border bg-card px-2"
          >
            {/* Cria as opções de 1 a 14 dias. */}
            {Array.from({ length: 14 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <button onClick={onDone} className="h-8 rounded bg-brand-500 px-3 text-white">
          OK
        </button>
      </div>
    );
  }
  // Se é uma compra com tamanho (merch), mostra os botões S, M, L e XL. O tamanho escolhido fica destacado.
  if (item.kind === "compra" && item.size) {
    return (
      <div className="mt-2 flex items-center gap-2 text-xs">
        {["S", "M", "L", "XL"].map((s) => (
          <button
            key={s}
            onClick={() => {
              update(item.key, { size: s });
              onDone();
            }}
            className={`h-8 min-w-9 rounded border px-2 ${item.size === s ? "bg-brand-700 text-white" : "bg-card"}`}
          >
            {s}
          </button>
        ))}
      </div>
    );
  }
  // Nenhum dos casos acima? Não há nada para editar.
  return null;
}

// O ecrã do carrinho completo.
export function CartView() {
  const { items, ready, count, subtotal, shipping, hasMerch, promo, setPromo, update, remove } = useCart();
  // `editing` guarda qual item está com o editor aberto (ou nenhum).
  const [editing, setEditing] = useState<string | null>(null);
  // `code` é o texto que a pessoa escreve no campo do código promocional.
  const [code, setCode] = useState(promo?.code ?? "");
  // `promoMsg` é a mensagem que aparece depois de aplicar o código (sucesso ou erro).
  const [promoMsg, setPromoMsg] = useState<string | null>(null);

  // Contas finais: desconto e total (subtotal - desconto + portes).
  const discount = discountFor(subtotal, promo?.percentOff);
  const total = subtotal - discount + shipping;

  // Pergunta ao servidor (GET /api/promo) se o código é válido. Se for, guarda-o no carrinho.
  async function applyPromo() {
    setPromoMsg(null);
    const res = await fetch(`/api/promo?code=${encodeURIComponent(code)}`);
    const data = await res.json();
    if (!res.ok) {
      // Código inválido: tira qualquer código anterior e mostra o erro.
      setPromo(null);
      setPromoMsg(data.error);
    } else {
      // Código bom: guarda-o e mostra uma mensagem de sucesso.
      setPromo(data);
      setPromoMsg(`Código ${data.code} aplicado: -${data.percentOff}%`);
    }
  }

  // Monta a frase-resumo por baixo do título, ex.: "3 artigos · jogos, merch e bilhetes".
  // Primeiro vê que tipos diferentes existem (o Set não deixa repetidos)...
  const kinds = new Set(items.map((i) => (i.kind === "aluguer" ? "jogos para alugar" : i.kind === "bilhete" ? "bilhetes" : i.productType === "merch" ? "merch" : "jogos")));
  // ...e junta-os com vírgulas, trocando a última vírgula por " e ".
  const summary = [...kinds].join(", ").replace(/, ([^,]*)$/, " e $1");

  // Se já lemos o carrinho e ele está vazio, mostra o ecrã de "carrinho vazio" e pára por aqui.
  if (ready && items.length === 0) {
    return (
      <div className="space-y-4 py-16 text-center">
        <ShoppingCart className="mx-auto size-12 text-brand-300/50" />
        <CheckoutHeading>O teu carrinho está vazio</CheckoutHeading>
        <p className="text-muted-foreground">Explora o catálogo e adiciona jogos, merch ou bilhetes.</p>
        <div className="flex justify-center gap-3">
          <Link href="/jogos" className="rounded-md bg-brand-500 px-4 py-2 text-sm text-white hover:brightness-110">
            Ver jogos
          </Link>
          <Link href="/eventos" className="rounded-md border px-4 py-2 text-sm hover:bg-white/10">
            Ver eventos
          </Link>
        </div>
      </div>
    );
  }

  // Carrinho com artigos: desenha a lista completa.
  return (
    <div className="space-y-3">
      <CheckoutHeading>O teu carrinho</CheckoutHeading>
      <CheckoutSteps current={1} />
      <p className="pt-1 text-sm text-foreground">
        {items.length} {items.length === 1 ? "artigo" : "artigos"}
        {summary ? ` · ${summary}` : ""}
      </p>

      <div className="mt-2 border-t border-white/20">
        {/* Cabeçalho da tabela (só aparece em ecrãs grandes). */}
        <div className="hidden grid-cols-[1fr_190px_117px] py-3 text-xs font-medium text-foreground md:grid">
          <span>Artigo / detalhes</span>
          <span>Quantidade</span>
          <span>Subtotal</span>
        </div>
        {/* Cada linha entra a deslizar e, ao remover, sai para o lado enquanto as outras sobem. */}
        <AnimatePresence initial={false} mode="popLayout">
        {/* Uma linha para cada item do carrinho. */}
        {items.map((item) => (
          <motion.div
            key={item.key}
            layout="position"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.45 }}
            className="grid grid-cols-[88px_1fr] gap-x-4 gap-y-3 border-b border-white/20 py-3 md:grid-cols-[88px_1fr_190px_117px]"
          >
            {/* A imagem pequena do artigo. */}
            <ArtPlaceholder color={item.color} image={item.kind === "bilhete" ? null : item.image} imageSizes="88px" kind={item.kind === "bilhete" ? "bilhete" : item.kind === "compra" && item.productType === "merch" ? "merch" : "jogo"} size="sm" className="h-[67px] w-[88px] rounded-sm" />
            {/* O texto: tipo, nome e detalhes. */}
            <div className="min-w-0">
              <p className="text-[11px] font-medium tracking-wide text-foreground uppercase">{itemEyebrow(item)}</p>
              <p className="text-[17px] text-foreground">{item.kind === "bilhete" ? item.eventName : item.name}</p>
              {describe(item).map((l) => (
                <p key={l} className="text-xs leading-5 text-foreground/90">
                  {l}
                </p>
              ))}
              {/* O botão de alterar muda conforme o tipo: bilhetes levam à página de eventos; aluguer e merch com tamanho abrem o editor. */}
              {item.kind === "bilhete" ? (
                <Link href="/eventos" className="text-xs leading-6 text-foreground hover:underline">
                  Alterar sessão
                </Link>
              ) : item.kind === "aluguer" || item.size ? (
                <button onClick={() => setEditing(editing === item.key ? null : item.key)} className="text-xs leading-6 text-foreground hover:underline">
                  {item.kind === "aluguer" ? "Alterar datas" : "Alterar opção"}
                </button>
              ) : null}
              {/* Se este item é o que está a ser editado, mostra o editor. */}
              {editing === item.key && <ItemEditor item={item} onDone={() => setEditing(null)} />}
            </div>
            {/* Os botões − e + para mudar a quantidade. Se a quantidade é 1 e carregas em −, o item é removido. */}
            <div className="col-start-2 flex items-start md:col-start-auto">
              <div className="flex h-8 w-28 items-center justify-between rounded-sm border border-white/20 bg-card px-2 text-sm">
                <button
                  aria-label="Diminuir quantidade"
                  onClick={() => (item.quantity > 1 ? update(item.key, { quantity: item.quantity - 1 }) : remove(item.key))}
                  className="grid size-6 place-items-center rounded hover:bg-muted"
                >
                  <Minus className="size-3" />
                </button>
                <span aria-live="polite">{item.quantity}</span>
                <button aria-label="Aumentar quantidade" onClick={() => update(item.key, { quantity: item.quantity + 1 })} className="grid size-6 place-items-center rounded hover:bg-muted">
                  <Plus className="size-3" />
                </button>
              </div>
            </div>
            {/* O subtotal deste item (preço × quantidade) e o botão de remover. */}
            <div className="col-start-2 flex items-center justify-between md:col-start-auto md:block">
              <p className="text-[17px] font-medium text-foreground">{formatEuro(item.unitCents * item.quantity)}</p>
              <button onClick={() => remove(item.key)} className="text-xs text-foreground hover:text-destructive hover:underline md:mt-3">
                Remover
              </button>
            </div>
          </motion.div>
        ))}
        </AnimatePresence>
      </div>

      {/* Em baixo: código promocional (à esquerda) e resumo com o total (à direita). */}
      <div className="grid gap-8 pt-6 md:grid-cols-[1fr_330px] md:gap-16">
        <div className="space-y-4">
          <div>
            <label htmlFor="promo" className="mb-2 block text-[13px] font-medium text-foreground">
              Código promocional
            </label>
            <div className="flex gap-3">
              <input
                id="promo"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Introduz o código"
                className="h-9 w-full max-w-[237px] rounded-sm border border-white/20 bg-card px-2.5 text-[13px] focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <button onClick={applyPromo} className="h-9 w-[90px] rounded-sm border border-white/20 bg-white/[0.06] text-[13px] hover:bg-white/10">
                Aplicar
              </button>
            </div>
            {/* A mensagem de sucesso ou erro do código, se houver. */}
            {promoMsg && <p className="mt-2 text-xs text-brand-300">{promoMsg}</p>}
          </div>
          <p className="text-xs leading-5 text-foreground">
            O jogo é levantado e devolvido na loja.
            <br />O merch é enviado; os bilhetes chegam por e-mail.
          </p>
          <div className="pt-4">
            <BackLink href="/">Continuar a explorar</BackLink>
          </div>
        </div>

        {/* O resumo da compra. */}
        <aside className="space-y-2 text-sm text-foreground">
          <h2 className="text-[17px]">Resumo</h2>
          <div className="flex justify-between">
            <span>Artigos ({count} unidades)</span>
            <span>{formatEuro(subtotal)}</span>
          </div>
          {/* A linha do desconto só aparece se houver desconto. */}
          {discount > 0 && (
            <div className="flex justify-between text-brand-300">
              <span>Desconto ({promo?.code})</span>
              <span>-{formatEuro(discount)}</span>
            </div>
          )}
          {/* A linha dos portes só aparece se houver merch. */}
          {hasMerch && (
            <div className="flex justify-between">
              <span>Envio de merch</span>
              <span>{formatEuro(shipping)}</span>
            </div>
          )}
          <div className="flex items-baseline justify-between border-t border-white/20 pt-3">
            <span className="font-medium">Total (IVA incluído)</span>
            <span className="text-[19px] font-semibold">{formatEuro(total)}</span>
          </div>
          <div className="pt-4">
            <Link href="/carrinho/dados" className={primaryCta}>
              Continuar para os dados
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
