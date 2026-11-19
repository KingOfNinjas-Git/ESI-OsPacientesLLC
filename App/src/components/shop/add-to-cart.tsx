// FICHEIRO: add-to-cart.tsx
// O botão "Adicionar ao carrinho" e a janelinha de opções (comprar ou alugar, datas, tamanho).
// É usado nos cartões de produto e na página de cada produto.
//
// "use client": corre no browser, porque reage a cliques e usa o carrinho.

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/components/cart/cart-provider";
import { finalPrice, formatEuro } from "@/lib/format";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

// Devolve a data de hoje no formato "AAAA-MM-DD". Serve de data mínima no campo do levantamento do aluguer.
const today = () => new Date().toISOString().slice(0, 10);

// O botão "Adicionar ao carrinho".
// Se houver escolhas a fazer (comprar ou alugar, tamanho do merch) abre uma janelinha.
// Se não houver nada a escolher, adiciona logo ao carrinho.
export function AddToCartButton({ product, className, children }: { product: Product; className?: string; children?: React.ReactNode }) {
  const { add } = useCart();
  // O estado do componente:
  //   open      → a janelinha está aberta?
  //   mode      → "compra" ou "aluguer"
  //   size      → tamanho escolhido (por omissão o segundo da lista, ou o primeiro)
  //   startDate → data de levantamento do aluguer
  //   days      → número de dias do aluguer
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"compra" | "aluguer">("compra");
  const [size, setSize] = useState(product.sizes?.[1] ?? product.sizes?.[0] ?? "");
  const [startDate, setStartDate] = useState(today());
  const [days, setDays] = useState(3);

  // Contas e verificações antes de mostrar o botão:
  //   unit        → preço de uma unidade, já com desconto
  //   canRent     → o artigo pode ser alugado?
  //   needsDialog → há alguma escolha a fazer (aluguer ou tamanhos)?
  //   soldOut     → está esgotado?
  const unit = finalPrice(product);
  const canRent = product.rent_cents_per_day != null;
  const needsDialog = canRent || (product.sizes?.length ?? 0) > 0;
  const soldOut = product.stock <= 0;

  // Adiciona uma compra ao carrinho. O `key` leva o tamanho, por isso o tamanho M e o tamanho L ficam em linhas diferentes.
  function addPurchase() {
    add({
      key: `compra-${product.id}-${size}`,
      kind: "compra",
      productId: product.id,
      name: product.name,
      productType: product.type,
      unitCents: unit,
      quantity: 1,
      size: size || undefined,
      color: product.color,
      image: product.image_url,
    });
  }

  // O botão de confirmar da janelinha: adiciona um aluguer (preço por dia × dias) ou uma compra, conforme o modo escolhido.
  function confirm() {
    if (mode === "aluguer" && product.rent_cents_per_day) {
      add({
        key: `aluguer-${product.id}-${startDate}-${days}`,
        kind: "aluguer",
        productId: product.id,
        name: product.name,
        perDayCents: product.rent_cents_per_day,
        unitCents: product.rent_cents_per_day * days,
        startDate,
        days,
        quantity: 1,
        color: product.color,
        image: product.image_url,
      });
    } else {
      addPurchase();
    }
    // Fecha a janelinha.
    setOpen(false);
  }

  return (
    <>
      {/* O botão principal. Se estiver esgotado fica desativado e diz "Esgotado".
          Se houver escolhas a fazer abre a janelinha; senão adiciona logo. */}
      <button
        type="button"
        disabled={soldOut}
        onClick={() => (needsDialog ? setOpen(true) : addPurchase())}
        className={cn(
          "w-full border-t border-white/10 bg-card py-1 font-display text-[13px] font-semibold text-foreground transition hover:brightness-110 hover:text-spark focus-visible:bg-brand-700 focus-visible:text-spark focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground",
          className,
        )}
      >
        {soldOut ? "Esgotado" : (children ?? "Adicionar ao carrinho")}
      </button>

      {/* A janelinha de opções. */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{product.name}</DialogTitle>
            <DialogDescription>{product.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Se o artigo se pode alugar, mostra duas caixas: "Comprar" e "Alugar". */}
            {canRent && (
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as typeof mode)} className="grid grid-cols-2 gap-3">
                {[
                  { v: "compra", title: "Comprar", price: formatEuro(unit) },
                  { v: "aluguer", title: "Alugar", price: `${formatEuro(product.rent_cents_per_day!)} / dia` },
                ].map((o) => (
                  <Label
                    key={o.v}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-sm border p-3 transition",
                      mode === o.v && "border-brand-500 bg-brand-500/20",
                    )}
                  >
                    <RadioGroupItem value={o.v} />
                    <span className="flex flex-col gap-1">
                      <span className="font-display font-semibold">{o.title}</span>
                      <span className="text-xs text-muted-foreground">{o.price}</span>
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            )}

            {/* Só no modo aluguer: escolher a data de levantamento e quantos dias. */}
            {mode === "aluguer" && canRent && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`start-${product.id}`}>Levantar na loja</Label>
                  <input
                    id={`start-${product.id}`}
                    type="date"
                    min={today()}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 w-full rounded-md border bg-card px-2 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`days-${product.id}`}>Dias</Label>
                  <select
                    id={`days-${product.id}`}
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="h-9 w-full rounded-md border bg-card px-2 text-sm"
                  >
                    {/* Opções de 1 a 14 dias. */}
                    {Array.from({ length: 14 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d} {d === 1 ? "dia" : "dias"}
                      </option>
                    ))}
                  </select>
                </div>
                {/* A conta do aluguer: dias × preço por dia = total. */}
                <p className="col-span-2 text-sm text-muted-foreground">
                  {days} {days === 1 ? "dia" : "dias"} × {formatEuro(product.rent_cents_per_day!)} ={" "}
                  <strong className="text-foreground">{formatEuro(product.rent_cents_per_day! * days)}</strong> · levantar e devolver na loja
                </p>
              </div>
            )}

            {/* Só no modo compra e se o artigo tiver tamanhos (merch): botões S, M, L... */}
            {mode === "compra" && product.sizes && product.sizes.length > 0 && (
              <div className="space-y-1.5">
                <Label>Tamanho</Label>
                <div className="flex gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
                      className={cn(
                        "h-9 min-w-11 rounded-sm border px-3 font-display text-sm font-semibold",
                        size === s ? "border-brand-500 bg-brand-700 text-white" : "bg-card hover:bg-muted",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={confirm} className="w-full sm:w-auto">
              Adicionar ao carrinho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
