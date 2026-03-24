# Changelog — Moja Kuchnia

## [Aktualna wersja] — 2026-03-24

### Nowe funkcje
- **Notatki do przepisów** — każda karta ma przycisk ✏️ otwierający panel notatek; wpisany tekst i status "sprawdzony" zapisywane w Supabase i widoczne dla wszystkich użytkowników
- **Sprawdzony przepis** — zielona odznaka i ramka wyróżniają przepisy oznaczone jako przetestowane
- **Obsługa Facebook/Instagram** — dodawanie przepisów z linków FB/IG przez scraping Open Graph (og:description jako kontekst dla AI)
- **Czytelniejszy tytuł** — czcionka zmieniona na Nunito, rozmiar 17px z grubszym krojem

### Poprawki
- Odświeżenie 9 starych przepisów (5 kroków → 10–23 kroków) przez ponowną analizę Gemini/Groq
- Migracja Supabase: nowe kolumny `notatka` (text) i `sprawdzony` (boolean)

---

## 2026-03-17 — Migracja na Vite + React 19 + TypeScript + Tailwind

### Architektura
- Przepisanie całej aplikacji z czystego HTML/JS na **Vite + React 19 + TypeScript**
- Stylowanie przez **Tailwind CSS v4**
- Wdrożenie na **Vercel** (serverless functions w `/api/*.js`)
- Baza danych: migracja z Google Sheets na **Supabase** (PostgreSQL)

### AI Pipeline
- **Gemini 2.0 Flash** (`file_data.file_uri`) — ogląda wideo YouTube bezpośrednio, bez transkrypcji; 1500 req/dzień za darmo
- **Groq / Llama 3.3 70B** — fallback z transkrypcją; 14 400 req/dzień za darmo
- **Batch update** — modal uzupełniający kroki dla wszystkich przepisów bez kroków
- Transkrypcje cachowane w Supabase — kolejne uruchomienia nie odpytują YT ponownie

### UI
- Karty przepisów z zakładkami Składniki / Przepis
- Animowany progress bar w trybie batch
- Kategorie z kolorowymi paskami i emoji
- Wyszukiwarka po nazwie i składnikach
- Tryb admin (edycja, usuwanie, ręczne dodawanie)
- Podobne przepisy pod rozwinięciem karty

---

## Wcześniejsze wersje (HTML/JS)

- **v7** — Integracja YouTube transcript + AI (Groq)
- **v6** — Miniaturki wideo, interaktywny image picker
- **v5** — Edycja przepisów inline
- **v4** — Wyszukiwarka składników
- **v3** — Kategorie i filtrowanie
- **v2** — Połączenie z Google Sheets API
- **v1** — Statyczna lista przepisów w HTML

---

## Technologie i API

### Frontend
| Technologia | Zastosowanie |
|---|---|
| React 19 + TypeScript | UI, logika komponentów |
| Vite 8 | bundler, dev server |
| Tailwind CSS v4 | stylowanie |
| Google Fonts — Nunito, Inter | typografia |

### Backend (Vercel Serverless)
| Endpoint | Opis |
|---|---|
| `/api/gemini.js` | Analiza wideo YouTube przez Gemini 2.0 Flash |
| `/api/groq.js` | Ekstrakcja przepisu przez Llama 3.3 70B (z transkrypcją) |
| `/api/transcript.js` | Pobieranie transkrypcji YouTube (youtube-transcript.io) |
| `/api/og.js` | Scraping Open Graph z Facebook/Instagram |
| `/api/unsplash.js` | Wyszukiwanie zdjęć (Unsplash API) |
| `/api/pexels.js` | Wyszukiwanie zdjęć (Pexels API) |
| `/api/youtube.js` | Wyszukiwanie filmów + resolve handle kanału |

### Zewnętrzne API
| API | Plan | Zastosowanie |
|---|---|---|
| **Google Gemini 2.0 Flash** | Free (1 500 req/dzień) | Analiza wideo YT, ekstrakcja składników i kroków |
| **Groq — Llama 3.3 70B** | Free (14 400 req/dzień) | Analiza tekstu / transkrypcji, fallback |
| **youtube-transcript.io** | Płatny | Transkrypcje YouTube |
| **YouTube Data API v3** | Free (quota) | Wyszukiwanie filmów, resolve handle kanału |
| **Unsplash API** | Free (50 req/godz.) | Zdjęcia do przepisów |
| **Pexels API** | Free (200 req/godz.) | Zdjęcia do przepisów |
| **Wikimedia/Wikipedia API** | Free (open) | Zdjęcia potraw z Wikimedia Commons |
| **Supabase** | Free tier | Baza danych PostgreSQL, REST API |
| **Vercel** | Free tier | Hosting + serverless functions |
