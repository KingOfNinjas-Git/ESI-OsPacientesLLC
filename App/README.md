# GameHaven

Website da GameHaven — biblioteca de jogos e terceiro espaço social — desenvolvido pelo grupo **OsPacientesLLC** (ES1).
Implementa o protótipo Figma *Gamehaven Development* com a stack definida pelo grupo.

> 📘 **Novo no código?** Lê o [guia do código](docs/ARQUITETURA.md): explica a organização,
> o fluxo de compra, as permissões e as tarefas mais comuns. Cada ficheiro tem um comentário no topo.

| Camada | Tecnologia |
| --- | --- |
| Linguagem | TypeScript (front-end e back-end) |
| Site | Next.js 15 (App Router) — páginas e API no mesmo projeto |
| Estilos e componentes | Tailwind CSS 4 + shadcn/ui |
| Base de dados | MySQL 8 (driver `mysql2`) |
| Autenticação | Auth.js (NextAuth v5) com papéis `cliente`, `trabalhador`, `administrador` |
| App desktop | Electron a abrir o site (mesma UI, como o Discord) |
| Alojamento | Hostinger |

## Começar

Requisitos: Node.js 20+ e um servidor MySQL 8.

```bash
npm install
cp .env.example .env.local      # preencher DB_* e AUTH_SECRET (npx auth secret)
npm run db:setup                # cria a BD, as tabelas e dados de exemplo
npm run dev                     # http://localhost:3000
```

> ⚠️ `npm run db:setup` apaga e recria todas as tabelas.

### Contas de demonstração

Palavra-passe de todas: `gamehaven123`

| Papel | Email | Acesso |
| --- | --- | --- |
| Cliente | `cliente@gamehaven.pt` | Loja, carrinho, `/conta` |
| Trabalhador | `trabalhador@gamehaven.pt` | + `/trabalhador` (stock, produtos, eventos, encomendas) |
| Administrador | `admin@gamehaven.pt` | + `/admin` (estatísticas, utilizadores) |

Códigos promocionais de exemplo: `HAVEN10` (-10%), `BEMVINDO` (-5%).

## Páginas (ligação ao Figma)

| Figma | Rota |
| --- | --- |
| Loading Screen | `src/app/loading.tsx` e ecrã inicial do Electron |
| Home Page (Destaques, Categorias, Items) | `/` |
| Promoções | `/promocoes` |
| Jogos (Categorias, Layout 1/2, Filtros) | `/jogos` |
| Merch | `/merch` |
| Eventos (Informação, Bilhetes, Organizadores) | `/eventos`, `/eventos/[slug]` |
| Autenticação — Iniciar sessão / Registar | `/login`, `/registar` |
| Carrinho — jogos, merch e eventos | `/carrinho` |
| Carrinho — dados | `/carrinho/dados` |
| Carrinho — pagamento | `/carrinho/pagamento` |

Páginas extra necessárias aos requisitos do Documento Visão: `/produto/[slug]`, `/pesquisa`, `/conta`,
`/trabalhador`, `/admin` e `/info/*` (ligações do rodapé).

Cores do Figma ("Cores"): `#18063A` (cabeçalho) e `#250663` (barra de navegação), definidas como tokens em
`src/styles/theme.css` (`bg-brand-950`, `bg-brand-900`, …), junto com a paleta derivada (ver
[guia do código, secção 7](docs/ARQUITETURA.md#7-aspeto-visual)). Os jogos usam as capas em `public/games/`
(coluna `products.image_url`); o merch e os produtos sem capa usam uma arte gerada a partir da cor (`ArtPlaceholder`).

## Estrutura

Mapa completo em [docs/ARQUITETURA.md](docs/ARQUITETURA.md#3-mapa-das-pastas).

```
db/                 schema.sql + setup.ts (seed)
docs/               ARQUITETURA.md (guia do código)
electron/           main.ts (app desktop) + assets
public/             logótipo, capas dos jogos (games/), logótipos de pagamento
src/
  app/              páginas, arrumadas por grupo: (loja) (compra) (utilizador) (gestao) + api/
  components/       peças das páginas: layout/ shop/ cart/ events/ auth/ staff/ animations/ ui/
  server/           tudo o que mexe na BD: db, consultas, login, permissões, actions/
  lib/              utilidades partilhadas: formatação, tipos
  styles/           globals.css + theme.css (cores) + utilities.css + animations.css
  middleware.ts     bloqueia rotas protegidas
```

## Regras de negócio

- O carrinho fica no browser; **preços, descontos e stock são sempre recalculados no servidor** (`POST /api/orders`), numa transação MySQL.
- Jogos podem ser comprados ou alugados (preço/dia × dias, levantar e devolver na loja). Merch tem envio de 3,50 €. Bilhetes são enviados por e-mail.
- Os passos *Dados* e *Pagamento* exigem sessão iniciada.
- **O pagamento é simulado** (MB WAY / Multibanco / Cartão). Não existe integração com nenhum gateway nem são guardados dados de cartão.
- Novas contas são criadas como `cliente`; só o administrador muda papéis.

## App desktop (Electron)

```bash
npm run electron:dev        # Next.js + Electron em simultâneo
npm run electron:dist       # gera instalador em release/ (dmg / nsis / AppImage)
```

A app abre `GAMEHAVEN_URL` (por omissão `http://localhost:3000` em desenvolvimento). Antes de gerar o
instalador, alterar `PRODUCTION_URL` em `electron/main.ts` para o domínio da Hostinger.

> Se correres comandos do Electron no terminal integrado do VS Code e a app arrancar como Node,
> executa `unset ELECTRON_RUN_AS_NODE` primeiro.

## Alojamento (Hostinger)

1. No hPanel, criar uma base de dados MySQL e importar `db/schema.sql` (ou correr `npm run db:setup` com as credenciais remotas).
2. Criar uma aplicação Node.js (planos com suporte Node.js), com *build command* `npm run build` e *start command* `npm start`.
3. Definir as variáveis de ambiente de `.env.example` (`DB_*`, `AUTH_SECRET`, `AUTH_TRUST_HOST=true`).

## Scripts

| Script | Descrição |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` / `typecheck` | ESLint / TypeScript |
| `npm test` | Testes (Vitest) |
| `npm run db:setup` | Recria a base de dados com dados de exemplo |
| `npm run electron:dev` / `electron:dist` | App desktop |
