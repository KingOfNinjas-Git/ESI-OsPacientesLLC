// FICHEIRO: art-placeholder.tsx
// A imagem dos artigos nos cartões, nas listas, no carrinho e na página do produto.
// Não tem estado, por isso pode correr tanto no servidor como no browser. As imagens estão em `public/games/`.

import Image from "next/image";
import { CalendarDays, Dices, Gamepad2, Monitor, Shirt, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrbitLines } from "@/components/animations/planet";

// Qual o ícone a mostrar na arte gerada, conforme o tipo de artigo.
const icons = { jogo: Gamepad2, tabuleiro: Dices, pc: Monitor, merch: Shirt, evento: CalendarDays, bilhete: Ticket };

// A "arte" do artigo.
//  - Com `image`: mostra a capa verdadeira, com um véu escuro em cima e em baixo
//    para o texto por cima continuar a ler-se bem.
//  - Sem imagem: gera uma arte bonita a partir da cor do produto (usado no merch
//    e nos produtos novos que ainda não têm capa).
export function ArtPlaceholder({
  color,
  label,
  kind = "jogo",
  className,
  size = "md",
  image,
  imageSizes = "(min-width: 768px) 25vw, 50vw",
}: {
  color: string;
  label?: string;
  kind?: keyof typeof icons;
  className?: string;
  size?: "sm" | "md" | "lg";
  image?: string | null;
  imageSizes?: string;
}) {
  // CASO 1: o artigo tem imagem.
  if (image) {
    return (
      // A imagem é recortada para encher a caixa toda. Fora das miniaturas ("sm") põe-se um véu escuro por cima.
      <div className={cn("relative overflow-hidden bg-brand-950", className)} aria-hidden>
        <Image src={image} alt="" fill sizes={imageSizes} className="object-cover object-[50%_22%] transition-transform duration-700 ease-[var(--ease-apple)] group-hover:scale-[1.06]" />
        {size !== "sm" && (
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(24_6_58/0.75)_0%,transparent_32%,transparent_55%,rgb(24_6_58/0.9)_100%)]" />
        )}
      </div>
    );
  }
  // CASO 2: não tem imagem. Cria-se um fundo com degradé da cor do produto, anéis de órbita e um ícone
  // (com o nome por baixo, se houver `label`).
  const Icon = icons[kind];
  return (
    <div
      className={cn("relative grid place-items-center overflow-hidden text-white", className)}
      style={{ background: `linear-gradient(150deg, ${color} 0%, color-mix(in oklab, ${color} 35%, #250663) 55%, #18063a 100%)` }}
      aria-hidden
    >
      <OrbitLines className="absolute -right-[6%] -bottom-[18%] h-[115%] text-white/[0.16]" />
      <div className="relative flex flex-col items-center gap-2 px-3 text-center">
        {/* O tamanho do ícone e do texto muda conforme o `size` (pequeno, médio ou grande). */}
        <Icon className={cn(size === "sm" ? "size-6" : size === "lg" ? "size-14" : "size-9", "opacity-85 drop-shadow-[0_2px_8px_rgb(24_6_58/0.5)]")} strokeWidth={1.4} />
        {label && (
          <span className={cn("font-display leading-tight font-bold", size === "lg" ? "text-2xl" : size === "sm" ? "text-[10px]" : "text-sm")}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
