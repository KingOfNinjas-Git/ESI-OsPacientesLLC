// FICHEIRO: cart-provider.tsx
// Aqui vive o estado do carrinho, partilhado por TODO o site (usa o "React Context").
// Pensa no Context como um quadro na parede onde toda a gente pode ler e escrever,
// sem ter de passar o carrinho de mão em mão por cada componente.
//
// O carrinho vive no BROWSER (no localStorage, com o nome "gamehaven-cart-v1"). Por isso:
//   - funciona mesmo sem teres sessão iniciada;
//   - não se perde se recarregares a página.
// Guarda 3 coisas:
//   - items:   os artigos (ver `CartItem` em lib/types.ts)
//   - promo:   o código promocional aplicado
//   - details: os dados de contacto e entrega do passo 2
//
// Qualquer componente usa o carrinho assim: `const { items, add } = useCart()`.
// Os preços daqui servem só para MOSTRAR. O servidor refaz todas as contas quando cria a encomenda (POST /api/orders).
//
// "use client": este ficheiro corre no browser (usa estado, efeitos e localStorage).

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { CartItem } from "@/lib/types";
import { SHIPPING_CENTS } from "@/lib/format";

// Os dados preenchidos no passo 2 ("Os teus dados"). A morada só é obrigatória se houver merch.
export interface CheckoutDetails {
  name: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
}

// Tudo o que o `useCart()` nos entrega: os dados, os totais já calculados e as funções para mexer no carrinho.
interface CartContextValue {
  items: CartItem[]; // os artigos no carrinho
  ready: boolean; // true quando já lemos o carrinho guardado (antes disso não sabemos se está vazio)
  count: number; // total de unidades
  subtotal: number; // soma dos preços (sem desconto nem portes)
  shipping: number; // portes (0 se não houver merch)
  hasMerch: boolean; // true se há pelo menos uma peça de merch
  promo: { code: string; percentOff: number } | null; // código promocional aplicado (ou nenhum)
  details: CheckoutDetails | null; // dados do passo 2
  add: (item: CartItem) => void; // adiciona um item
  update: (key: string, patch: Partial<CartItem>) => void; // altera um item
  remove: (key: string) => void; // remove um item
  clear: () => void; // esvazia o carrinho
  setPromo: (p: { code: string; percentOff: number } | null) => void;
  setDetails: (d: CheckoutDetails) => void;
}

// O "quadro na parede" em si. Começa vazio (null) até o CartProvider o preencher.
const CartContext = createContext<CartContextValue | null>(null);
// O nome com que guardamos o carrinho no browser.
// Se um dia a estrutura guardada mudar de forma incompatível, muda-se o "v1" para "v2" para não lermos dados antigos.
const STORAGE_KEY = "gamehaven-cart-v1";

// Lê um valor guardado no localStorage. Se não existir, ou se estiver estragado, devolve o `fallback` (valor de reserva).
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// Este componente envolve a aplicação (em app/layout.tsx) e dá o carrinho a todos os componentes lá dentro.
export function CartProvider({ children }: { children: React.ReactNode }) {
  // Os 4 "cadernos" onde guardamos o estado. Quando um muda, o React redesenha o ecrã.
  const [items, setItems] = useState<CartItem[]>([]);
  const [promo, setPromo] = useState<CartContextValue["promo"]>(null);
  const [details, setDetails] = useState<CheckoutDetails | null>(null);
  const [ready, setReady] = useState(false);

  // PASSO 1) Quando o site abre, recupera o carrinho que estava guardado.
  // O `ready` serve para não mostrarmos "carrinho vazio" por engano antes de termos lido o que estava guardado.
  useEffect(() => {
    const saved = load(STORAGE_KEY, { items: [] as CartItem[], promo: null, details: null });
    setItems(saved.items ?? []);
    setPromo(saved.promo ?? null);
    setDetails(saved.details ?? null);
    setReady(true);
  }, []);

  // PASSO 2) Sempre que algo muda no carrinho, guarda outra vez no localStorage.
  useEffect(() => {
    // Enquanto ainda não lemos o que estava guardado, não escrevemos nada (senão apagávamos o carrinho antigo).
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, promo, details }));
    } catch {
      /* armazenamento indisponível: o carrinho fica só em memória */
    }
  }, [items, promo, details, ready]);

  // Adiciona um item. Se já existir um com o mesmo `key`, em vez de duplicar soma a quantidade.
  // Também mostra um aviso "Adicionado ao carrinho".
  const add = useCallback((item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.key === item.key);
      if (existing) {
        return prev.map((i) => (i.key === item.key ? { ...i, quantity: i.quantity + item.quantity } : i));
      }
      return [...prev, item];
    });
    toast.success("Adicionado ao carrinho", { description: item.kind === "bilhete" ? `${item.eventName} · ${item.name}` : item.name });
  }, []);

  // Altera campos de um item (quantidade, datas do aluguer, tamanho...). Só mexe no item com o `key` indicado.
  const update = useCallback((key: string, patch: Partial<CartItem>) => {
    setItems((prev) => prev.map((i) => (i.key === key ? ({ ...i, ...patch } as CartItem) : i)));
  }, []);

  // Remove um item: fica com todos menos o que tem esse `key`.
  const remove = useCallback((key: string) => setItems((prev) => prev.filter((i) => i.key !== key)), []);
  // Esvazia o carrinho e o código promocional (usado depois de a compra estar paga).
  const clear = useCallback(() => {
    setItems([]);
    setPromo(null);
  }, []);

  // Calcula os totais a partir dos itens. O `useMemo` só refaz a conta quando alguma coisa muda (poupa trabalho).
  const value = useMemo<CartContextValue>(() => {
    // Subtotal = soma de (preço × quantidade) de cada item.
    const subtotal = items.reduce((s, i) => s + i.unitCents * i.quantity, 0);
    // Há merch? Procura pelo menos um item de compra que seja merch.
    const hasMerch = items.some((i) => i.kind === "compra" && i.productType === "merch");
    return {
      items,
      ready,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal,
      shipping: hasMerch ? SHIPPING_CENTS : 0,
      hasMerch,
      promo,
      details,
      add,
      update,
      remove,
      clear,
      setPromo,
      setDetails,
    };
  }, [items, ready, promo, details, add, update, remove, clear]);

  // Pendura o carrinho no "quadro na parede" para todos os filhos poderem usar.
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// A função que os componentes usam para ler o carrinho. Só funciona dentro do <CartProvider>.
export function useCart() {
  const ctx = useContext(CartContext);
  // Se alguém a usar fora do CartProvider, avisamos com um erro claro.
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

// Calcula o desconto do código promocional. Aplica-se ao subtotal, não ao envio. Sem código = 0.
export const discountFor = (subtotal: number, percentOff?: number) =>
  percentOff ? Math.round((subtotal * percentOff) / 100) : 0;
