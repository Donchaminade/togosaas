-- Champs marketplace SaaS pour les solutions (table communities)
ALTER TABLE communities
  ADD COLUMN pricing_type ENUM('free', 'freemium', 'paid') NOT NULL DEFAULT 'free' AFTER status,
  ADD COLUMN price_amount DECIMAL(12, 2) NULL AFTER pricing_type,
  ADD COLUMN currency VARCHAR(8) NOT NULL DEFAULT 'XOF' AFTER price_amount,
  ADD COLUMN billing_period ENUM('monthly', 'yearly', 'one_time') NULL AFTER currency,
  ADD COLUMN app_url VARCHAR(500) NULL COMMENT 'Lien direct vers la solution' AFTER website_url,
  ADD COLUMN demo_url VARCHAR(500) NULL COMMENT 'Lien démo ou essai gratuit' AFTER app_url;

CREATE INDEX idx_communities_pricing_type ON communities (pricing_type);
