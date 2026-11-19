# GameHaven — Guia do código

Este guia explica como o site está organizado e como as peças se ligam. Para instalar e
correr o projeto, vê o [README](../README.md). Cada ficheiro tem também, no topo, um
comentário a explicar para que serve.

**Índice**

1. [Visão geral](#1-visão-geral)
2. [Como funciona um pedido](#2-como-funciona-um-pedido)
3. [Mapa das pastas](#3-mapa-das-pastas)
4. [Base de dados](#4-base-de-dados)
5. [Contas, papéis e permissões](#5-contas-papéis-e-permissões)
6. [Fluxo de compra](#6-fluxo-de-compra)
7. [Aspeto visual](#7-aspeto-visual)
8. [Tarefas comuns](#8-tarefas-comuns)
9. [Convenções](#9-convenções)
10. [Glossário](#10-glossário)

---

## 1. Visão geral

O GameHaven é **um único projeto Next.js** que contém o site e o back-end ao mesmo tempo:

| Peça | Onde está | Corre em |
| --- | --- | --- |
| Páginas | `src/app/**/page.tsx` | servidor (geram o HTML) |
| Componentes interativos | `src/components/**` com `"use client"` | browser |
| Alterações de dados vindas de formulários (server actions) | `src/server/actions/*.ts` | servidor |
| API HTTP | `src/app/api/**/route.ts` | servidor |
| Base de dados | MySQL, acedido por `src/server/db.ts` | servidor |
| App desktop | `electron/main.ts`: uma janela que abre o site | computador do utilizador |

Não há um servidor separado para a API: o Next.js trata das páginas e dos pedidos à BD.

## 2. Como funciona um pedido

### Abrir uma página (p.ex. `/jogos?plataforma=xbox`)

```
Browser ──pedido──▶ middleware.ts ──▶ app/(loja)/jogos/page.tsx (servidor)
                    (rota protegida?)        │
                                             ├─ getProducts({ platform: "xbox" })  ← server/data.ts → MySQL
                                             └─ devolve HTML já com os produtos
Browser ◀──HTML────────────────────────────────┘
        └─ os componentes "use client" (carrinho, filtros, carrossel) ganham interatividade
```

- **Server Components** (o padrão, sem `"use client"`) correm no servidor e podem ler a BD
  diretamente. É o caso de todas as páginas.
- **Client Components** (`"use client"` na primeira linha) correm no browser. São usados só
  quando é preciso interatividade: cliques, estado, `localStorage`. Não podem importar
  nada de `src/server/`: o `import "server-only"` faz o build falhar se isso acontecer.
- `export const dynamic = "force-dynamic"` numa página obriga a gerá-la a cada pedido,
  porque o stock e os preços mudam.

### Alterar dados

Há duas formas, conforme quem faz o pedido:

| Forma | Usada em | Exemplo |
| --- | --- | --- |
| **Server action**: função `"use server"` passada a `<form action={...}>` | Área do trabalhador, Administração, login/registo | `updateProductAction` em `server/actions/staff.ts` |
| **Rota de API**: `fetch("/api/...")` a partir do browser | Carrinho (código promocional, criar encomenda) | `POST /api/orders` |

Depois de alterar dados, as server actions chamam `revalidatePath(...)` para as páginas
mostrarem os valores novos.

## 3. Mapa das pastas

Regra geral: **cada assunto tem a sua pasta**. Para encontrar alguma coisa, começa por aqui:

| Procuras… | Vai a |
| --- | --- |
| uma página do site | `src/app/(grupo)/<url>/page.tsx` |
| um bocado de uma página (cartão, menu, formulário) | `src/components/<área>/` |
| uma animação ou ilustração | `src/components/animations/` e `src/styles/animations.css` |
| uma cor | `src/styles/theme.css` |
| algo que lê/escreve na base de dados | `src/server/` |
| formatar preços/datas, tipos | `src/lib/` |

```
gamehaven/
├── db/                         BASE DE DADOS
│   ├── schema.sql              tabelas (APAGA e recria tudo)
│   └── setup.ts                npm run db:setup: cria a BD com dados de exemplo
├── docs/                       este guia
├── electron/main.ts            APP DESKTOP (janela que abre o site)
├── public/                     FICHEIROS ESTÁTICOS (servidos tal como estão)
│   ├── brand/logo.png          logótipo
│   ├── games/<slug>.jpg        capas dos jogos
│   └── payments/               logótipos MB, MB WAY, Visa/Mastercard
└── src/
    ├── middleware.ts           porteiro: bloqueia rotas protegidas (tem de ficar aqui)
    │
    ├── app/                    PÁGINAS — cada pasta é um URL
    │   ├── layout.tsx          esqueleto de todas as páginas (cabeçalho, navegação, rodapé)
    │   ├── loading.tsx         ecrã de carregamento
    │   ├── not-found.tsx       página 404
    │   ├── (loja)/             páginas da loja
    │   │   ├── page.tsx        /                    página inicial
    │   │   ├── jogos/          /jogos
    │   │   ├── merch/          /merch
    │   │   ├── promocoes/      /promocoes
    │   │   ├── pesquisa/       /pesquisa?q=
    │   │   ├── produto/[slug]/ /produto/elden-ring
    │   │   ├── eventos/        /eventos e /eventos/<slug>
    │   │   └── info/[slug]/    /info/contactos, /info/termos…
    │   ├── (compra)/           passos da compra
    │   │   └── carrinho/       /carrinho → dados/ → pagamento/ → confirmado/
    │   ├── (utilizador)/       contas
    │   │   ├── login/          /login
    │   │   ├── registar/       /registar
    │   │   └── conta/          /conta (as minhas encomendas)
    │   ├── (gestao)/           áreas internas da loja
    │   │   ├── trabalhador/    /trabalhador
    │   │   └── admin/          /admin
    │   └── api/                pedidos feitos pelo browser (não são páginas)
    │       ├── orders/         POST /api/orders: criar encomenda
    │       ├── promo/          GET /api/promo: validar código promocional
    │       └── auth/           rotas internas do login
    │
    ├── components/             PEÇAS DAS PÁGINAS
    │   ├── layout/             cabeçalho, barra de navegação, rodapé, menus, título
    │   ├── shop/               cartões de produto, filtros, carrossel, adicionar ao carrinho
    │   ├── cart/               estado do carrinho + os 3 passos da compra
    │   ├── events/             página de evento, programa, botão de bilhete
    │   ├── auth/               formulários de login e registo
    │   ├── staff/              peças das áreas de trabalhador/admin
    │   ├── animations/         planeta, anel de carregamento, estrelas
    │   └── ui/                 componentes shadcn/ui gerados (não editar)
    │
    ├── server/                 SÓ CORRE NO SERVIDOR (mexe na base de dados)
    │   ├── db.ts               ligação ao MySQL: query() e execute()
    │   ├── data.ts             consultas de leitura: produtos, categorias, eventos
    │   ├── auth.ts             login com email + palavra-passe
    │   ├── auth.config.ts      que papel acede a que rota (PROTECTED)
    │   ├── session.ts          requireRole(): proteção dentro de páginas/actions
    │   └── actions/            alterações vindas de formulários
    │       ├── auth.ts         entrar, registar, sair
    │       └── staff.ts        stock, produtos, eventos, utilizadores, encomendas
    │
    ├── lib/                    UTILIDADES PARTILHADAS (servidor e browser)
    │   ├── format.ts           euros, datas em PT, portes de envio
    │   ├── types.ts            tipos (Product, CartItem, …)
    │   └── utils.ts            cn() para juntar classes
    │
    ├── styles/                 ESTILOS
    │   ├── globals.css         ponto de entrada: junta os outros + estilos base
    │   ├── theme.css           cores (a paleta)
    │   ├── utilities.css       classes próprias: chamfer, cut-tr, starfield
    │   └── animations.css      animações em CSS
    │
    └── types/next-auth.d.ts    acrescenta role/firstName aos tipos do Auth.js
```

**Pastas entre parênteses** (`(loja)`, `(compra)`, `(utilizador)`, `(gestao)`) servem só para
arrumar e **não aparecem no URL**: `app/(loja)/jogos/page.tsx` continua a ser `/jogos`.
É uma funcionalidade do Next.js chamada *route groups*.

Numa pasta de rota, `[slug]` é um parâmetro do URL. `app/(loja)/produto/[slug]/page.tsx`
responde a `/produto/qualquer-coisa` e recebe `params.slug = "qualquer-coisa"`.

## 4. Base de dados

```
users ──1:N── orders ──1:N── order_items ──N:1── products
                                   └──────N:1── ticket_types ──N:1── events
promo_codes  (independente)
```

| Tabela | Guarda | Notas |
| --- | --- | --- |
| `users` | contas | `role` = cliente / trabalhador / administrador; palavra-passe em hash bcrypt |
| `products` | jogos e merch | `rent_cents_per_day` NULL = não se aluga; `image_url` NULL = arte gerada |
| `events` | eventos | `program` tem uma linha por ponto; `organizers` é JSON |
| `ticket_types` | bilhetes de cada evento | preço e stock próprios |
| `promo_codes` | códigos de desconto | `HAVEN10`, `BEMVINDO` nos dados de exemplo |
| `orders` | encomendas | `status` = pendente / pago / cancelado |
| `order_items` | linhas da encomenda | copiam o nome e o preço **no momento da compra** |

- **Leituras**: `src/server/data.ts`, ou `query()` diretamente na página (admin, conta).
- **Escritas**: `src/server/actions/staff.ts`, `src/server/actions/auth.ts` e `src/app/api/orders/route.ts`.
- `npm run db:setup` **apaga tudo**. Para mudar uma BD que já tem dados, usa `ALTER TABLE`
  e atualiza também `schema.sql` para quem criar a BD de raiz.

## 5. Contas, papéis e permissões

| Papel | Pode |
| --- | --- |
| visitante (sem sessão) | ver a loja e encher o carrinho |
| `cliente` | + comprar, alugar, ver `/conta` |
| `trabalhador` | + `/trabalhador`: stock, preços, produtos, eventos, estado das encomendas |
| `administrador` | + `/admin`: estatísticas, papéis e contas; apagar produtos/eventos |

A proteção existe em **três camadas**:

1. **Middleware** (`middleware.ts` + `PROTECTED` em `server/auth.config.ts`): antes de a página
   abrir, quem não tem sessão vai para o login e quem não tem o papel certo vai para a
   página inicial.
2. **`requireRole(...)`** (`server/session.ts`): volta a verificar dentro de cada página e de
   **cada server action**. É obrigatório, porque uma action pode ser chamada diretamente,
   sem passar pela página.
3. **Interface**: os menus só mostram as ligações que o papel pode usar. É só conveniência,
   nunca segurança.

A sessão é um JWT num cookie com `id`, `role` e `firstName`. Nas páginas lê-se com
`const session = await auth()`.

## 6. Fluxo de compra

```
[Adicionar ao carrinho] ─▶ cart-provider (localStorage do browser)
        │
/carrinho ─────────▶ /carrinho/dados ───────▶ /carrinho/pagamento ──▶ POST /api/orders ─▶ /carrinho/confirmado
cart-view.tsx        details-form.tsx         payment-form.tsx        (servidor, transação)
quantidades,         nome, email, morada      método, termos
datas, código promo  (morada só com merch)    (exige sessão)
```

1. O **carrinho vive no browser** (`components/cart/cart-provider.tsx`). Funciona sem sessão.
2. Os passos *Dados* e *Pagamento* **exigem sessão**, por causa do middleware.
3. Ao pagar, o browser envia **só ids, quantidades e opções**. O servidor
   (`api/orders/route.ts`), numa **transação**:
   - lê os preços e o stock atuais (`SELECT ... FOR UPDATE`), sempre pela mesma ordem
     (artigos por id, depois bilhetes) para duas compras nunca ficarem num *deadlock*;
   - recusa o pedido se algo esgotou ou deixou de existir;
   - desconta o stock, calcula o código promocional e os portes (3,50 € se houver merch);
   - grava `orders` + `order_items`.
4. **O pagamento é simulado**: Multibanco fica "pendente" com uma referência aleatória, até
   um trabalhador o marcar como pago; MB WAY e cartão ficam logo "pagos".
5. **Stock e cancelamentos** (`server/orders.ts`): cancelar uma encomenda devolve o stock e a
   utilização do código promocional. Uma encomenda cancelada não volta a outro estado.
   Encomendas Multibanco por pagar há mais de **48 h** são canceladas automaticamente
   (verificado a cada nova compra).
6. **Códigos promocionais**: têm `active`, `expires_at` (opcional) e `max_uses` (opcional);
   `uses` conta as utilizações. A mesma regra vale em `/api/promo` e em `/api/orders`.
7. **Limite de tentativas** (`lib/rate-limit.ts`, em memória): login (8 por IP+email / 10 min),
   registo (5 por IP / hora), códigos promocionais (20 por IP / min), encomendas
   (10 por utilizador / 10 min). Ao exceder, a resposta é `429`.

## 7. Aspeto visual

- **Layout**: segue o Figma *Gamehaven Development*. As posições e as medidas vêm do protótipo.
- **Tema escuro e "cinematográfico"**: o fundo (`--background`, #0D0320) é mais escuro que o
  cabeçalho; os cartões (`--card`) e os painéis (`--popover`) sobem em claridade; as linhas são
  brancas transparentes (`border-white/10`). O texto usa `text-foreground` / `text-muted-foreground`
  (nunca `text-brand-950` em fundos escuros). `text-brand-950` só se usa sobre o dourado (`spark`).
  Há um brilho violeta fixo por trás da página (em `globals.css`).
- **Cores** (`:root` em `styles/theme.css`), a partir das cores do Figma:

  | Nome | Hex | Classe | Uso |
  | --- | --- | --- | --- |
  | Noite | `#18063A` | `brand-950` | cabeçalho, fundos escuros |
  | Órbita | `#250663` | `brand-900` | barra de navegação, botões |
  | Violeta | `#6B3CF0` | `brand-500` | foco, estados ativos |
  | Lilás | `#B9A4FF` | `brand-300` | linhas sobre fundo escuro |
  | Faísca | `#FFC94D` | `spark` | CTA principal, "Novo", descontos (usar pouco) |
  | Poeira | `#F0EDF8` | `surface` | fundo da página |

- **Fontes**: `font-display` (Chakra Petch) em títulos, botões e preços; texto normal em Onest.
- **Classes próprias**:
  - `chamfer`: cantos cortados. Cores com `[--ch-fill:...]`, linha com `[--ch-line:...]`,
    tamanho do corte com `[--cut:8px]`.
  - `cut-tr`: corta só o canto superior direito (cartões, blocos).
  - `starfield`: céu estrelado em fundos escuros.
- **Movimento** (biblioteca `motion`, em `components/motion/primitives.tsx`):
  - `Reveal`: o conteúdo sobe e surge quando entra no ecrã;
  - `Stagger` + `StaggerItem`: grelhas e blocos aparecem em cascata (usado em `ProductGrid` e `PromoBanners`);
  - `MotionProvider` (no layout): respeita o "reduzir movimento" do sistema em todas as animações;
  - `app/template.tsx`: entrada de cada página, em CSS (`page-in`), para nunca haver um ecrã vazio à espera do JavaScript;
  - destaques da página inicial: crossfade, texto em cascata, parallax do planeta e indicador com progresso;
  - carrinho: o número do cabeçalho "salta" e as linhas entram/saem a deslizar.
  - Regra: as animações mudam **como o conteúdo chega**, nunca o tamanho nem a posição final (o layout é o do Figma).
  - Curva de travagem suave partilhada: `--ease-apple` (CSS) e `EASE` (motion).
- **Classes úteis novas**: `glass` (vidro fosco: desfoque + borda fina); `chamfer` ganhou brilho ao passar o rato.
- **Animações e ilustrações**: `components/animations/` (planeta, órbitas, estrela, anel de
  carregamento), inspirados no logótipo. As animações em CSS estão em `styles/animations.css`.
- **Capas dos jogos**: `public/games/<slug>.jpg`, ligadas pela coluna `products.image_url`.
  Vieram da Wikipedia e têm direitos de autor: servem para o projeto académico.
- **`components/ui/`**: são do shadcn/ui. Não se editam; personaliza-se com `className`.

## 8. Tarefas comuns

**Criar uma página nova** (p.ex. `/sobre`)
1. Escolhe o grupo certo e cria `src/app/(loja)/sobre/page.tsx` com `export default function Page() { ... }`.
2. Usa `<Container>` e `<PageTitle>` de `components/layout/page-title.tsx`.
3. Se precisar de dados, torna a função `async` e chama funções de `server/data.ts`.

**Proteger uma rota por papel**
Acrescenta-a a `PROTECTED` em `server/auth.config.ts` **e** a `config.matcher` em `middleware.ts`.
Dentro da página chama `await requireRole("trabalhador", "administrador")`.

**Acrescentar uma ação de formulário**
Cria uma função em `server/actions/staff.ts` que começa com `await requireRole(...)`, valida
os dados (zod), escreve na BD com `query(... ?, [valores])` e chama `revalidatePath`.

**Pôr a capa de um jogo**
Guarda a imagem como `public/games/<slug>.jpg` e corre:
`UPDATE products SET image_url = '/games/<slug>.jpg' WHERE slug = '<slug>';`

**Acrescentar uma coluna à BD**
1. Cria `db/migrations/NNN_descricao.sql` com o `ALTER TABLE` (numeração seguinte à última).
2. Corre-o na tua BD: `mysql -u root gamehaven < db/migrations/NNN_descricao.sql`.
3. Atualiza `db/schema.sql` (e `db/setup.ts`, se a coluna tiver dados de exemplo).
4. Acrescenta o campo ao tipo em `src/lib/types.ts`.
5. Avisa a equipa: cada pessoa corre o mesmo ficheiro de migração (não precisa de apagar dados).

**Correr os testes**
`npm test` corre os testes (`src/**/*.test.ts`, com Vitest). A lógica que se quer testar deve
ficar em funções puras, como `lib/pricing.ts`. No GitHub, `.github/workflows/ci.yml` corre
`typecheck`, `lint` e os testes em cada push.

**Criar um código promocional com limites**
`INSERT INTO promo_codes (code, percent_off, expires_at, max_uses) VALUES ('NATAL15', 15, '2026-12-31 23:59:59', 100);`

**Mudar uma cor do site**
Altera o valor em `:root` no `styles/theme.css`. Todas as classes que a usam mudam.

## 9. Convenções

- **Dinheiro em cêntimos** (inteiros): `4499` = 44,99 €. Só `formatEuro()` converte para texto.
- **SQL sempre com `?`**: `query("... WHERE id = ?", [id])`. Nunca juntes valores ao texto do SQL.
- **Slug**: identificador legível no URL (`elden-ring`). É único em `products` e `events`.
- **Validação**: no browser para dar erros rápidos e **outra vez no servidor** (zod), que é a que conta.
- **Texto da interface e comentários** em português europeu.
- **Antes de entregar**: `npm run typecheck` e `npm run lint` têm de passar.

## 10. Glossário

| Termo | Significado |
| --- | --- |
| App Router | Sistema de rotas do Next.js baseado em pastas (`src/app`) |
| Server Component | Componente que corre no servidor; pode ler a BD |
| Client Component | Componente com `"use client"`; corre no browser, tem estado e cliques |
| Server action | Função `"use server"` chamada por um formulário, que corre no servidor |
| Middleware | Código que corre antes de cada pedido às rotas indicadas |
| Context / `useCart()` | Forma de partilhar o carrinho entre componentes sem passar props |
| Transação | Grupo de operações na BD que é gravado todo ou nada |
| `revalidatePath` | Pede ao Next.js para voltar a gerar uma página com dados novos |
| shadcn/ui | Coleção de componentes copiados para `components/ui` |
