-- PhishGuard AI - MySQL Schema
-- Auto-executed on server startup

CREATE DATABASE IF NOT EXISTS phishguard
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE phishguard;

-- ----------------------------------------------------------------
-- scan_results: stores every URL analysis
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scan_results (
  id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  url             TEXT            NOT NULL,
  protocol        VARCHAR(10)     NOT NULL DEFAULT 'http',
  domain          VARCHAR(255)    NOT NULL DEFAULT '',
  subdomain       VARCHAR(255)    NOT NULL DEFAULT '',
  path            TEXT            NOT NULL,
  tld             VARCHAR(30)     NOT NULL DEFAULT '',
  risk_score      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  classification  ENUM('safe', 'suspicious', 'phishing') NOT NULL DEFAULT 'safe',
  confidence      FLOAT           NOT NULL DEFAULT 0,
  security_grade  ENUM('A', 'B', 'C', 'D', 'F') NOT NULL DEFAULT 'A',
  risk_level      VARCHAR(20)     NOT NULL DEFAULT 'Safe',
  features        JSON            NOT NULL,
  reasons         JSON            NOT NULL,
  recommendations TEXT            NOT NULL ,
  scan_duration_ms INT UNSIGNED   NOT NULL DEFAULT 0,
  session_id      VARCHAR(64)     NOT NULL DEFAULT '',
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_classification (classification),
  INDEX idx_risk_score (risk_score),
  INDEX idx_created_at (created_at),
  INDEX idx_session_id (session_id),
  FULLTEXT INDEX ft_url (url)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------
-- scan_stats: aggregated analytics view
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW scan_stats AS
SELECT
  COUNT(*)                                                AS total_scans,
  SUM(classification = 'safe')                           AS safe_count,
  SUM(classification = 'suspicious')                     AS suspicious_count,
  SUM(classification = 'phishing')                       AS phishing_count,
  ROUND(AVG(risk_score), 1)                              AS avg_risk_score,
  ROUND(SUM(classification = 'phishing') / COUNT(*) * 100, 1) AS phishing_pct,
  ROUND(SUM(classification = 'safe')     / COUNT(*) * 100, 1) AS safe_pct,
  MIN(created_at)                                        AS first_scan,
  MAX(created_at)                                        AS last_scan
FROM scan_results;
