// FICHEIRO: ui/label.tsx
// O título de um campo de formulário.
// Este ficheiro foi gerado pela ferramenta shadcn (`npx shadcn add ...`). Evita editá-lo:
// para mudar o aspeto usa o `className` onde o usas, ou as cores em styles/theme.css.

"use client"

import * as React from "react"
import { cn } from "cn"

// O título do campo. Ao clicar nele, o campo fica selecionado.
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
