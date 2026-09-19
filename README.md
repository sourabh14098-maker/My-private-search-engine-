# Ditch Google!R! / DitchX — Privacy-First Search Engine

**Ditch Google!R!** is an independent, privacy-focused search engine project designed to provide private search without trackers, profiling, or personal data collection.

---

## Architecture Overview

The system consists of two decoupled components:

1. **Frontend (`/src`)**:
   - Built with React 19, TypeScript, and Vite.
   - Fast, editorial dark-mode interface with consistent layouts across all 8 search verticals.
   - Uses a central API client (`src/services/searchService.ts`) with Vite proxy integration and graceful offline fallback.

2. **Backend Foundation (`/backend`)**:
   - Built with Node.js, TypeScript, and Express.
   - Decoupled Service-Provider pattern (`SearchService` and `MockSearchProvider`).
   - Privacy-by-design middleware: strips search queries, IP addresses, and user-agent fingerprints from logs; enforces security headers (`no-referrer`, `nosniff`, `DENY`).
   - Centralized validation and error handling for all 8 search verticals.
   - Configurable `DEMO_MODE` flag: returns honest prototype responses when enabled, or HTTP `501 Not Implemented` when disabled if no live crawler/index is active.

```
Frontend (React 19 + Vite)
      │
      │ /api/search?q={query}&v={vertical}
      ▼
Vite Dev Proxy (or direct VITE_API_BASE_URL)
      │
      ▼
Backend (Node.js + TypeScript + Express)
      ├── Security & Privacy Headers (nosniff, no-referrer)
      ├── Privacy Request Logger (no query/IP logging)
      ├── Request Validator (q presence, 500 char max, supported verticals)
      ├── SearchService (Provider Dispatcher)
      │     ├── [DEMO_MODE=true] ──> MockSearchProvider (8 verticals)
      │     └── [DEMO_MODE=false] ─> 501 Not Implemented (honest index missing)
      └── Centralized Error Handler (standardized JSON error responses)
```

---

## Prerequisites

- **Node.js**: `v18.0.0` or higher (tested on `v24.18.0`)
- **npm**: `v9.0.0` or higher

---

## Installation

### 1. Root / Frontend Dependencies
```bash
npm install
```

### 2. Backend Dependencies
```bash
npm --prefix backend install
```

---

## Environment Variable Setup

### Frontend (`.env`)
Create a `.env` file in the project root if targeting an external backend. In local development, leave it empty to use the Vite proxy:
```bash
cp .env.example .env
```
Contents:
```ini
# Base URL for search backend API (leave empty for local Vite proxy to http://localhost:3001)
VITE_API_BASE_URL=
```

### Backend (`backend/.env`)
Create `backend/.env`:
```bash
cp backend/.env.example backend/.env
```
Contents:
```ini
# Port for backend service
PORT=3001

# Environment
NODE_ENV=development

# Allowed CORS Origin for frontend client
CORS_ORIGIN=http://localhost:5173

# Demo mode: when true, returns structured mock index results.
# When false, returns 501 Not Implemented until crawler/index is connected.
DEMO_MODE=true
```

---

## Running the Services

### Option A: Run Backend and Frontend in Separate Terminals (Recommended)

**Terminal 1 — Backend:**
```bash
npm run backend
# Or: cd backend && npm run dev
```
Backend starts on `http://localhost:3001`.

**Terminal 2 — Frontend:**
```bash
npm run dev
```
Frontend starts on `http://localhost:5173`. Requests to `/api/*` are automatically proxied to `http://localhost:3001`.

### Option B: Run Frontend Alone
If the backend is not running, the frontend client gracefully detects offline status and uses local prototype data with zero disruption.

---

## Available API Endpoints

### 1. Health Check
```http
GET /api/health
```
**Example Response (`200 OK`):**
```json
{
  "status": "healthy",
  "service": "Ditch Google!R! Search Backend",
  "timestamp": "2026-09-19T09:50:04.313Z",
  "uptimeSeconds": 103,
  "version": "0.2.0",
  "environment": "development",
  "demoMode": true,
  "supportedVerticals": [
    "all",
    "images",
    "videos",
    "news",
    "maps",
    "shopping",
    "books",
    "ai"
  ]
}
```

### 2. Search Endpoint
```http
GET /api/search?q={query}&v={vertical}
```

#### Parameters:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | Yes | — | Search query (1 to 500 characters, trimmed) |
| `v` (or `vertical`) | string | No | `all` | Vertical: `all`, `images`, `videos`, `news`, `maps`, `shopping`, `books`, `ai` |

#### Example: Web Search
```bash
curl "http://localhost:3001/api/search?q=open%20source&v=all"
```
**Response (`200 OK`):**
```json
{
  "query": "open source",
  "vertical": "all",
  "isDemo": true,
  "provider": "mock-index",
  "resultCount": "Demo results · 4 sample entries for \"open source\" (Mock index)",
  "results": [ ... ],
  "discussions": [ ... ],
  "relatedSearches": [ ... ],
  "questions": [ ... ],
  "metadata": {
    "executionTimeMs": 2,
    "timestamp": "2026-09-19T09:50:15.194Z",
    "isIndexedData": false,
    "notice": "Demo data from mock index. Independent crawler and index are planned."
  }
}
```

#### Example: Validation Error (Missing Query)
```bash
curl "http://localhost:3001/api/search"
```
**Response (`400 Bad Request`):**
```json
{
  "error": true,
  "code": "INVALID_QUERY",
  "message": "Query parameter 'q' is required. Example: /api/search?q=technology",
  "statusCode": 400,
  "timestamp": "2026-09-19T09:51:30.596Z"
}
```

#### Example: Unsupported Vertical
```bash
curl "http://localhost:3001/api/search?q=test&v=crypto"
```
**Response (`400 Bad Request`):**
```json
{
  "error": true,
  "code": "INVALID_VERTICAL",
  "message": "Unsupported vertical 'crypto'. Supported verticals are: all, images, videos, news, maps, shopping, books, ai.",
  "statusCode": 400,
  "timestamp": "2026-09-19T09:51:44.148Z"
}
```

---

## How Demo Mode Works

- **`DEMO_MODE=true` (Default)**: The backend returns sample catalog results across all 8 verticals. Every response explicitly includes `isDemo: true`, `metadata.isIndexedData: false`, and an honest provenance notice.
- **`DEMO_MODE=false`**: If switched to non-demo mode before a live crawler and index are connected, the search endpoint returns `HTTP 501 Not Implemented` with code `NOT_IMPLEMENTED` and an explicit explanation rather than silently fabricating real results.

---

## Testing & Quality Assurance

Run the automated checks:

```bash
# Run backend integration tests (17 test cases covering all verticals & errors)
npm run test:backend

# Run backend TypeScript compiler build
npm run backend:build

# Run frontend Oxlint check
npm run lint

# Run frontend TypeScript typecheck and Vite build
npm run build
```

---

## Privacy & Security Considerations

- **No Search Logging**: The backend middleware logs only HTTP methods, status codes, and execution times. User queries and IP addresses are never written to server logs or disks.
- **Privacy Headers**: Responses enforce `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, and `Permissions-Policy: interest-cohort=()`.
- **Honest Metrics**: No fake index counts or fabricated crawler logs.
- **Current Limitations**: The backend currently relies on prototype responses while the independent web crawler and ranking index are developed. Live external searching requires Phase 3 implementation.

---

## Recommended Next Step: Phase 3

**Phase 3: Web Crawler & Ingestion Pipeline**:
1. Implement a distributed, rate-limited polite crawler complying with `robots.txt`.
2. Document parser (HTML extraction, metadata extraction, canonical link resolution).
3. Text indexing engine (tokenization, BM25 / inverted index with SQLite or Tantivy/Elasticsearch).
4. Ranking pipeline with privacy-respecting heuristics.
