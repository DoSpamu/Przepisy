# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Vite dev server on localhost:5173 (frontend only)
npm run build      # tsc -b && vite build (type-check + production bundle)
npm run lint       # ESLint
npx vercel dev     # Run both frontend + serverless /api/* functions locally
```

There are no tests. The build (`npm run build`) is the primary correctness check — it runs TypeScript strict mode before Vite bundling.

## Architecture

**Two separate runtimes in one repo:**

1. **Frontend** — React 19 + TypeScript SPA (`src/`), bundled by Vite, deployed as static files to Vercel CDN.
2. **Serverless functions** — plain Node.js ES modules (`api/*.js`), each file = one Vercel function. They proxy API calls so keys never reach the browser.

The frontend never calls external AI/image APIs directly — it always goes through `/api/*`.

## Data flow: adding a recipe

```
User pastes URL → AddModal
  → if YouTube: /api/gemini (Gemini 2.0 Flash watches video directly via file_data.file_uri)
    → on failure/non-YT: /api/transcript → /api/groq (Llama 3.3 70B with transcript context)
  → if FB/IG: /api/og (OG scrape with facebookexternalhit UA) → /api/groq
  → result: { name, cat, skladniki[], kroki[], q }
  → ImagePicker: /api/unsplash + /api/pexels + Wikimedia Commons (direct, has CORS)
  → saved to Supabase via supabase-js anon client
```

## Key files

| File | Role |
|---|---|
| `src/constants.ts` | `ALL_CATS`, `WIEPRZOWINA_CATS`, color maps, localStorage key names |
| `src/types.ts` | `Recipe`, `YTVideo`, `ImageResult` interfaces |
| `src/lib/supabase.ts` | All DB operations — `sheetsLoad/Save/Update/Delete`, `saveRecipeNote` |
| `src/lib/api.ts` | Frontend→serverless wrappers: `aiAnalyze`, `fetchWikimedia`, image fetchers, `ytSearch`/`resolveHandle` |
| `src/lib/storage.ts` | `gs(key)` / `ss(key, val)` — typed localStorage helpers |
| `src/App.tsx` | All state lives here; passes callbacks down. No global state manager. |

## Supabase

- **Anon key** is public (in `src/constants.ts`) — protected by RLS: anon can SELECT and INSERT, not UPDATE/DELETE.
- **Service role key** is in memory files only — use it when RLS blocks something (schema migrations, bulk updates).
- Columns: `id`, `cat`, `name`, `link`, `note`, `wiki`, `q`, `skladniki text[]`, `kroki text[]`, `transcript`, `added_at`, `notatka`, `sprawdzony`.
- `note` field containing `🤝` marks community-submitted recipes (handled differently in delete/edit flows).

## Admin mode

PIN-protected via `/api/admin-verify.js` which reads `process.env.ADMIN_KEY`. The frontend stores the unlocked state only in React state (lost on reload). Env var name is `ADMIN_KEY` — not `ADMIN_PIN`.

## Caching strategy (localStorage)

| Key | Content | TTL |
|---|---|---|
| `img_chosen_v5` | `Record<recipeId, imageUrl>` — user-picked images | permanent |
| `yt_channel_cache_v1` | `Record<handle, channelId>` — resolved YT channel IDs | permanent |
| `yt_search_cache_v1` | `Record<recipeId, {rows, ts}>` — SimilarRecipes results | 24h |
| `rss_cache_v1` | `{videos[], ts}` — ProponowaneTab RSS results | 24h |

## Virtual categories

`🥩 Wieprzowina` is a UI-only tab that groups `🥩 Schab` + `🥩 Karkówka`. It is not stored in the DB. The tab only appears if at least one recipe has a Schab or Karkówka category. Similarly, `📺 Proponowane` replaces the recipe grid with `<ProponowaneTab>` which fetches YouTube RSS feeds (no API key, no quota).

## Serverless function conventions

- All `api/*.js` files use `export default function handler(req, res)` (Vercel Node.js runtime).
- Always set `Cache-Control: no-store` on auth/mutable endpoints; use `s-maxage` for cacheable data (RSS).
- API keys read from `process.env.*` — configured in Vercel dashboard, never in code.
- No shared code between `api/` files — each is self-contained.
