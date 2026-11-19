-- FICHEIRO: 001_promo_limits.sql
-- Migração 001 — acrescenta limites aos códigos promocionais.
-- Uma "migração" é uma pequena alteração a uma base de dados que já existe, sem apagar nada.
-- Corre UMA vez numa base de dados existente:
--   mysql -u root gamehaven < db/migrations/001_promo_limits.sql
-- Quem usar `npm run db:setup` já recebe estas colunas pelo schema.sql (não precisa disto).

-- Acrescenta 3 colunas à tabela dos códigos promocionais:
-- data de validade, máximo de utilizações e quantas vezes já foi usado.
ALTER TABLE promo_codes
  ADD COLUMN expires_at DATETIME NULL AFTER active,                -- NULL = não expira
  ADD COLUMN max_uses   INT UNSIGNED NULL AFTER expires_at,        -- NULL = sem limite
  ADD COLUMN uses       INT UNSIGNED NOT NULL DEFAULT 0 AFTER max_uses;

-- Acrescenta índices às encomendas. Ajudam a encontrar depressa as encomendas Multibanco pendentes (para as expirar)
-- e as encomendas de cada utilizador.
ALTER TABLE orders ADD INDEX idx_orders_status_created (status, created_at);
ALTER TABLE orders ADD INDEX idx_orders_user (user_id);
