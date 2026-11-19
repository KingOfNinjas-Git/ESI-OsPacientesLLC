# Onde está cada coisa

| Procuras… | Vai a |
| --- | --- |
| uma página do site | `app/(grupo)/<url>/page.tsx`: os grupos são `(loja)`, `(compra)`, `(utilizador)` e `(gestao)` |
| um bocado de uma página (cartão, menu, formulário) | `components/<área>/` |
| uma animação ou ilustração | `components/animations/` e `styles/animations.css` |
| uma cor | `styles/theme.css` |
| algo que lê ou escreve na base de dados | `server/` (encomendas e stock: `server/orders.ts`) |
| formatar preços ou datas, tipos | `lib/` |

As pastas entre parênteses servem só para arrumar e não aparecem no URL:
`app/(loja)/jogos/page.tsx` continua a ser `/jogos`.

Explicação completa: [docs/ARQUITETURA.md](../docs/ARQUITETURA.md).
