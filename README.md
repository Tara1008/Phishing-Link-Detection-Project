# 🛡️ PhishGuard AI

> A production-quality phishing URL detection web app with AI-ready architecture, MySQL persistence, and a stunning cybersecurity dashboard.

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MySQL 8+ (XAMPP, WAMP, or native)
- npm or pnpm

---

### 1. Clone and setup backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MySQL credentials
npm run dev
```

The backend will:
- Auto-create the `phishguard` database
- Auto-run `schema.sql` to create tables
- Start at http://localhost:3001

### 2. Setup and run frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## ⚙️ Environment Variables (backend/.env)

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=phishguard

FRONTEND_URL=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
```

---

## 📡 API Reference

| Method | Endpoint                 | Description                  |
|--------|--------------------------|------------------------------|
| POST   | `/api/analyze`           | Analyze a URL                |
| GET    | `/api/history`           | Get scan history             |
| GET    | `/api/history/:id`       | Get single scan              |
| DELETE | `/api/history/:id`       | Delete a scan                |
| DELETE | `/api/history/clear`     | Clear all history            |
| GET    | `/api/history/:id/export`| Export scan (JSON/CSV)       |
| GET    | `/api/stats`             | Aggregate statistics         |
| GET    | `/api/health`            | Health check                 |

### POST /api/analyze

```json
// Request body
{ "url": "https://example.com", "session_id": "optional-string" }

// Response
{
  "success": true,
  "data": {
    "id": 42,
    "url": "https://example.com",
    "risk_score": 5,
    "classification": "safe",
    "security_grade": "A",
    "confidence": 0.9,
    "risk_level": "Safe",
    "features": { ... },
    "reasons": [ ... ],
    "recommendations": "...",
    "scan_duration_ms": 12
  }
}
```

---

## 🗄️ Database Schema

```sql
TABLE scan_results (
  id              INT PK AUTO_INCREMENT,
  url             TEXT,
  protocol        VARCHAR(10),
  domain          VARCHAR(255),
  subdomain       VARCHAR(255),
  path            TEXT,
  tld             VARCHAR(30),
  risk_score      TINYINT,
  classification  ENUM('safe','suspicious','phishing'),
  confidence      FLOAT,
  security_grade  ENUM('A','B','C','D','F'),
  risk_level      VARCHAR(20),
  features        JSON,
  reasons         JSON,
  recommendations TEXT,
  scan_duration_ms INT,
  session_id      VARCHAR(64),
  created_at      DATETIME
)
```

---

## 🎯 Detection Signals (20+)

| Signal                  | Risk Delta |
|-------------------------|-----------|
| No HTTPS                | +15       |
| IP address in URL       | +35       |
| Suspicious TLD (.tk .ml)| +22       |
| URL shortener           | +20       |
| Long URL (> 75 chars)   | +10       |
| Very long URL (> 120)   | +12       |
| Many hyphens (> 3)      | +10       |
| Many dots (> 4)         | +12       |
| 3+ subdomains           | +15       |
| @ symbol in URL         | +25       |
| Double slash redirect   | +15       |
| Encoded characters      | +8        |
| High entropy (> 3.8)    | +10       |
| Many query params (> 5) | +8        |
| Suspicious keyword      | +8 each   |
| HTTPS bonus             | -8        |
| Short URL bonus         | -5        |
| Normal subdomain        | -3        |

---

## 🧠 ML-Ready Architecture

The code is modular and designed for ML upgrades:

```
backend/src/modules/
├── featureExtractor.ts   → Extract features (can output to ML pipeline)
├── riskCalculator.ts     → Rule-based engine (swap for ML model here)
├── explanationGenerator.ts → Generate human-readable reasons
└── reportGenerator.ts    → Format output
```

To integrate a Python ML model:
1. Create a POST `/ml-predict` microservice in Python (FastAPI/Flask)
2. Call it from `riskCalculator.ts` with the extracted features
3. Return the same `RiskResult` interface

---

## 🎨 UI Features

- ✅ Light/Dark mode toggle
- ✅ Animated SVG risk gauge
- ✅ Confetti on safe URL detection
- ✅ Drag & drop URL input
- ✅ Paste from clipboard
- ✅ Sample URLs (safe + phishing)
- ✅ Animated skeleton loading
- ✅ Pie, bar, and line charts (Recharts)
- ✅ Accordion reasons panel with severity badges
- ✅ Full URL component breakdown
- ✅ JSON + CSV export
- ✅ Print to PDF
- ✅ MySQL-backed scan history
- ✅ History search + delete + clear
- ✅ Toast notifications
- ✅ Glassmorphism cards
- ✅ Blob animations
- ✅ Mobile responsive

---

## ⚠️ Disclaimer

This tool provides an automated assessment based primarily on URL characteristics and heuristics. It does not guarantee that a website is safe or malicious. Always exercise caution when sharing sensitive information online.
