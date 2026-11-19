// FICHEIRO: ui/separator.tsx
// Uma linha fininha que separa partes do ecrã.
// Este ficheiro foi gerado pela ferramenta shadcn (`npx shadcn add ...`). Evita editá-lo:
// para mudar o aspeto usa o `className` onde o usas, ou as cores em styles/theme.css.

"use client"

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"
import { cn } from "cn"

// A linha separadora (horizontal ou vertical).
function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
