# Kontent.ai Duplicate Slug Finder

Embeddable custom app (Vite + TypeScript) to detect page content items (`system.type=page`) sharing the same slug (`url_slug` or `slug`) across multiple languages (default: `de`, `en`, `zh`).

## Features
- Search for a specific slug (multiple approaches: Delivery API + optional Management API*)
- Detect "real" duplicate slugs (same slug used by different content items, not just language variants)
- Group & summarize per content item with its language variants
- Automatic pagination (handles >1000 items per language)
- Lightweight UI (no heavy frontend framework)
- Security headers for Netlify deployment (CSP, etc.)

(*Management API only if the key is configured; consider keeping that key server-side.)

## Environment Variables
Set these (e.g. in Netlify build settings):
- `VITE_KONTENT_PROJECT_ID`
- `VITE_KONTENT_DELIVERY_API_KEY` (optional if project is public)
- `VITE_KONTENT_MANAGEMENT_API_KEY` (optional – avoid exposing if you plan serverless usage)
- `VITE_KONTENT_PREVIEW_API_KEY` (optional)

Notes:
- Vite only injects variables prefixed with `VITE_` into the client bundle.
- Sensitive keys (like Management) should ideally live in a serverless function instead of being exposed.

## Scripts
- `npm run dev` – Vite dev server (HMR)
- `npm run build` – TypeScript build + production bundle
- `npm run preview` – Preview the production build locally
- `npm run format` – Biome check (lint + format) read-only
- `npm run format:fix` – Apply auto-fixes (format + safe lint fixes)

## Formatting & Linting (Biome Only)
Prettier was removed to avoid duplication. Biome handles:
- Consistent formatting
- Style & quality lint rules
- Auto-fixes

Examples:
```
npm run format       # Show needed changes
npm run format:fix   # Apply them
```

Configure ignores or overrides in `biome.json`.

## Architecture & Tech Stack
**High-Level Flow**
1. Bootstrap (`main.ts`) initializes config and binds UI events.
2. Config loader (`src/config/index.ts`) resolves environment vars and (optionally) overrides project ID via Custom App context.
3. Search services (`src/services/*.ts`) orchestrate Delivery API calls (and placeholder Management API calls) + pagination.
4. Utils (`src/utils/index.ts`) provide grouping, filtering, slug analysis, and type shaping.
5. UI layer (`src/components/ui.ts`) renders summaries and duplicate groups.
6. Build (Vite) bundles TS → ESM + optimized assets for embedding (e.g. in an iframe/custom app host).

**Modules / Responsibilities**
- `config/` – Env + context resolution (non-sensitive logging)
- `services/api.ts` – Raw API interaction, slug search strategies
- `services/search.ts` – Duplicate detection orchestration
- `utils/index.ts` – Data shaping (group by slug, aggregate languages, stats)
- `components/ui.ts` – Pure rendering + DOM updates
- `style.css` – Extracted styling (no inline injection)

**Technologies**
- Vite (dev server + build)
- TypeScript (strong typing, no `any` / no non-null assertions policy)
- Biome (formatter + linter)
- Kontent.ai Delivery API (primary data source)
- (Optional) Kontent.ai Management API (future enhancements)
- Netlify (static hosting + optional functions + security headers)

**Data Model (Duplicates)**
- Raw items fetched per language → filtered to `page` + slug field present.
- Group by slug → discard groups with only one distinct codename.
- Each remaining group becomes a duplicate set (aggregate languages per content item).

## Duplicate Detection Flow
1. Fetch page items for each target language.
2. Keep only items containing `url_slug` or `slug`.
3. Group items by slug value.
4. Exclude groups with a single distinct codename (only language variants).
5. Return enriched duplicate groups and a simplified API-compatible result.

## Relevant Types
- `DuplicateGroup` – Internal enriched grouping (slug + aggregated language variants per content item)
- `DuplicateResult` – Public return shape exposing a simplified list for UI

## Deployment (Netlify)
1. Build: `npm run build`
2. Deploy the `dist/` folder
3. Set required environment variables (Site settings → Build & deploy → Environment)
4. (Optional) Adjust CSP / frame-ancestors in `netlify.toml` if embedding origins change

## Suggested Next Steps
- Unify public + internal duplicate models if legacy shape is no longer needed
- Add lightweight tests for grouping logic
- Add a language toggle / dynamic language list
- Introduce a serverless function to proxy Management API (keep key secret)

---
Keep the code clean:
```
npm run format:fix
```
This maintains zero lint errors and consistent formatting.