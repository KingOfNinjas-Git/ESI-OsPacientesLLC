-- FICHEIRO: schema.sql
-- Este ficheiro descreve a "planta" da base de dados do GameHaven (MySQL 8.x):
-- que tabelas existem e que colunas cada uma tem. É como o desenho de uma casa antes de a construir.
-- Executa-se com: npm run db:setup   (cria as tabelas e insere dados de exemplo)
--
-- ATENÇÃO: este ficheiro começa por APAGAR as tabelas (DROP TABLE). Só o uses
-- numa base de dados onde possas perder os dados.
--
-- Como as tabelas se relacionam (uma seta "1──N" quer dizer "um para muitos"):
--   users 1──N orders 1──N order_items N──1 products
--                                     └──N──1 ticket_types N──1 events
--   promo_codes é independente (o código fica copiado em orders.promo_code).
-- Os valores de dinheiro estão sempre em cêntimos (INT): 4499 = 44,99 €.

-- Garante que acentos e emojis ficam bem guardados.
SET NAMES utf8mb4;

-- Apaga as tabelas antigas (se existirem) para começar do zero.
-- A ordem importa: primeiro as que dependem de outras (order_items), por último as independentes (users).
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS ticket_types;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS promo_codes;
DROP TABLE IF EXISTS users;

-- TABELA users: as contas das pessoas e o papel de cada uma (cliente, trabalhador, administrador).
-- A palavra-passe nunca é guardada em texto normal, só o "hash" (versão baralhada).
CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  role          ENUM('cliente','trabalhador','administrador') NOT NULL DEFAULT 'cliente',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABELA products: o catálogo da loja. Tem jogos (para comprar e/ou alugar) e merch.
CREATE TABLE products (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug                VARCHAR(120) NOT NULL UNIQUE,
  type                ENUM('jogo','merch') NOT NULL,
  name                VARCHAR(160) NOT NULL,
  description         TEXT NOT NULL,
  platform            ENUM('playstation','xbox','nintendo','pc','tabuleiro') NULL,
  category            VARCHAR(60) NULL,            -- p.ex. "Estratégia", "T-shirts"
  price_cents         INT UNSIGNED NOT NULL,        -- preço de compra
  rent_cents_per_day  INT UNSIGNED NULL,            -- NULL = não disponível para aluguer
  discount_percent    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  stock               INT NOT NULL DEFAULT 0,
  popularity          INT NOT NULL DEFAULT 0,
  is_new              BOOLEAN NOT NULL DEFAULT FALSE,
  sizes               JSON NULL,                    -- merch: ["S","M","L"]
  color               VARCHAR(7) NOT NULL DEFAULT '#250663', -- cor do cartão
  image_url           VARCHAR(255) NULL,            -- capa (p.ex. /games/catan.jpg); NULL = arte gerada
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Os "índices" são como o índice de um livro: ajudam a base de dados a encontrar linhas mais depressa.
  INDEX idx_products_type (type),
  INDEX idx_products_platform (platform)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABELA events: os eventos temáticos da loja.
CREATE TABLE events (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug         VARCHAR(120) NOT NULL UNIQUE,
  name         VARCHAR(160) NOT NULL,
  tagline      VARCHAR(255) NOT NULL DEFAULT '',
  description  TEXT NOT NULL,
  program      TEXT NOT NULL,                       -- uma linha por ponto do programa
  starts_at    DATETIME NOT NULL,
  ends_at      DATETIME NOT NULL,
  location     VARCHAR(160) NOT NULL,
  capacity     INT UNSIGNED NOT NULL,
  min_age      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  featured     BOOLEAN NOT NULL DEFAULT FALSE,
  organizers   JSON NOT NULL,                       -- [{"label":"...","value":"..."}]
  color        VARCHAR(7) NOT NULL DEFAULT '#250663',
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABELA ticket_types: os tipos de bilhete de cada evento (cada um com preço e stock próprios).
-- Apagar um evento apaga também os seus bilhetes (ON DELETE CASCADE).
CREATE TABLE ticket_types (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id    INT UNSIGNED NOT NULL,
  name        VARCHAR(120) NOT NULL,
  description VARCHAR(255) NOT NULL DEFAULT '',
  price_cents INT UNSIGNED NOT NULL,
  stock       INT NOT NULL,
  CONSTRAINT fk_ticket_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABELA promo_codes: os códigos promocionais que se podem usar no carrinho (p.ex. HAVEN10 = -10%).
CREATE TABLE promo_codes (
  code          VARCHAR(40) PRIMARY KEY,
  percent_off   TINYINT UNSIGNED NOT NULL,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at    DATETIME NULL,                      -- NULL = não expira
  max_uses      INT UNSIGNED NULL,                  -- NULL = sem limite de utilizações
  uses          INT UNSIGNED NOT NULL DEFAULT 0     -- quantas vezes já foi usado
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABELA orders: as encomendas (carrinho -> dados -> pagamento).
-- Se a conta de quem comprou for apagada, a encomenda fica na mesma, só sem utilizador (ON DELETE SET NULL).
CREATE TABLE orders (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NULL,
  status          ENUM('pendente','pago','cancelado') NOT NULL DEFAULT 'pendente',
  contact_name    VARCHAR(160) NOT NULL,
  contact_email   VARCHAR(255) NOT NULL,
  address         VARCHAR(255) NULL,
  postal_code     VARCHAR(8) NULL,
  city            VARCHAR(120) NULL,
  payment_method  ENUM('mbway','multibanco','cartao') NOT NULL,
  payment_ref     VARCHAR(64) NULL,
  promo_code      VARCHAR(40) NULL,
  subtotal_cents  INT UNSIGNED NOT NULL,
  discount_cents  INT UNSIGNED NOT NULL DEFAULT 0,
  shipping_cents  INT UNSIGNED NOT NULL DEFAULT 0,
  total_cents     INT UNSIGNED NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_orders_status_created (status, created_at),
  INDEX idx_orders_user (user_id),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABELA order_items: as linhas (artigos) de cada encomenda.
-- Guardam o nome e o preço NO MOMENTO da compra, para o histórico não mudar
-- se o produto for alterado ou apagado mais tarde.
CREATE TABLE order_items (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id          INT UNSIGNED NOT NULL,
  kind              ENUM('compra','aluguer','bilhete') NOT NULL,
  product_id        INT UNSIGNED NULL,
  ticket_type_id    INT UNSIGNED NULL,
  name              VARCHAR(160) NOT NULL,
  details           VARCHAR(255) NOT NULL DEFAULT '',
  unit_price_cents  INT UNSIGNED NOT NULL,
  quantity          INT UNSIGNED NOT NULL,
  rental_start      DATE NULL,
  rental_days       INT UNSIGNED NULL,
  CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  CONSTRAINT fk_items_ticket FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
