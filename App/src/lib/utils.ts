// FICHEIRO: utils.ts
// Aqui fica uma ferramenta pequenina chamada `cn`.
// Serve para juntar várias classes de CSS (Tailwind) numa só frase.
// Se duas classes mandarem fazer coisas contrárias (ex.: "p-2" e "p-4"),
// ele fica só com a última. Ex.: cn("p-2", cond && "p-4")
// Os componentes da pasta "ui" (shadcn) usam isto o tempo todo.

// Vamos buscar o `cn` ao pacote que o traz e "re-exportamos" para o resto do projeto o poder importar daqui.
export { cn } from "cn"
