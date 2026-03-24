# Changelog — Moja Kuchnia

Pełna historia projektu od pierwszej linii kodu.

---

## [v4.0] — 2026-03-24 — Notatki, Gemini AI, Facebook/Instagram

### Nowe funkcje
- **Notatki do przepisów** — każda karta ma przycisk ✏️ otwierający panel notatek inline (bez modala). Wpisany tekst i status "sprawdzony" zapisywane w Supabase i widoczne dla wszystkich użytkowników po odświeżeniu strony
- **Sprawdzony przepis** — zielona odznaka ✅ w rogu zdjęcia i zielona ramka karty wyróżniają przepisy oznaczone jako przetestowane
- **Gemini 2.0 Flash** — nowy endpoint `/api/gemini.js`; Gemini ogląda wideo YouTube bezpośrednio przez `file_data.file_uri` bez potrzeby transkrypcji, wyciąga składniki i kroki patrząc na to co dzieje się na ekranie
- **Obsługa Facebook/Instagram** — nowy endpoint `/api/og.js` scrapuje Open Graph metadata (`og:title`, `og:description`) używając nagłówka `facebookexternalhit` żeby ominąć bot-detection; opis posta przekazywany jako kontekst do Groq
- **Lepsza czcionka tytułów** — Playfair Display zastąpione przez **Nunito** (700–900), rozmiar 17px — bardziej czytelne na ciemnym tle zdjęcia

### Poprawki i optymalizacje
- Odświeżenie 9 starych przepisów przez ponowną analizę AI (5 kroków → 10–26 kroków)
- Migracja schematu Supabase: nowe kolumny `notatka TEXT DEFAULT ''` i `sprawdzony BOOLEAN DEFAULT false`
- Zapis notatki debounce'owany (500ms) — brak zbędnych zapytań przy pisaniu
- Plik CHANGELOG.md + push na GitHub z pełną historią technologii

---

## [v3.0] — 2026-03-23 — Vite + React 19 + TypeScript + Tailwind + Transkrypcje

### Architektura — kompletne przepisanie

Cały projekt przepisany z pojedynczego pliku `index.html` na nowoczesny stack:

| Przed | Po |
|---|---|
| Jeden plik `index.html` (~1500 linii) | React 19 + TypeScript + Vite 8 |
| Inline CSS + klasy ręczne | Tailwind CSS v4 |
| `localStorage` jako "baza danych" | Supabase (PostgreSQL) |
| Klucze API w kodzie frontendowym | Vercel serverless functions (`/api/*.js`) |
| Pollinations AI / Groq w przeglądarce | Groq Llama 3.3 70B przez serwer |

### Nowe funkcje
- **YouTube transkrypcje** — endpoint `/api/transcript.js` pobiera napisy z YouTube przez youtube-transcript.io; transkrypcje cachowane w Supabase (jeden fetch na wideo)
- **Batch update kroków** — modal "🔄 Uzupełnij kroki" przetwarzający wszystkie przepisy bez kroków; progress bar, logi, możliwość anulowania
- **Kroki przyrządzania** — AI generuje minimum 10 szczegółowych kroków z pełnymi zdaniami i ilościami składników
- **Zakładki Składniki / Przepis** — rozwinięta karta pokazuje dwie zakładki z animowanym przełącznikiem
- **Podobne przepisy** — sekcja pod rozwinięciem karty z sugestiami z tej samej kategorii
- **Image Picker** — wyszukiwanie zdjęć z Unsplash, Pexels i Wikimedia Commons
- **YouTube wyszukiwarka** — wyszukiwanie filmów po kanale (thefoodini, Kocham Gotować, itp.)
- **Tryb admina** — edycja, usuwanie, ręczne dodawanie przepisów
- **Supabase CRUD** — pełna synchronizacja: load, save, update, delete z obsługą błędów

### Naprawione błędy
- `useState` w pętli `.map()` → wyekstrahowany komponent `FrameImg`
- Klucze API wyciekały do przeglądarki → przeniesione na serwer Vercel
- Vercel CDN cachował `/api/transcript` → dodany `Cache-Control: no-store`
- Odpowiedzi 304 Not Modified dla transkrypcji → cache-busting `?_=Date.now()`
- `package.json` z `"type":"module"` wymagał ES module syntax w API routes
- `BatchKrokiModal` licznik rósł powyżej 100% → `useState(() => ...)` zamiast `const` dla zamrożenia listy przy montowaniu

### Bezpieczeństwo
- Klucze Groq, Gemini, Unsplash, Pexels, YouTube przeniesione do zmiennych środowiskowych Vercel (`process.env.*`)

---

## [v2.0] — 2026-03-17 — React + Supabase + pierwsze AI

### Nowe funkcje
- **Supabase backend** — przepisy w PostgreSQL zamiast `localStorage`; dane dostępne dla wszystkich użytkowników
- **Groq / Llama 3.3 70B** — zastąpił Pollinations AI; lepsza jakość ekstrakcji składników i kategoryzacji
- **Pollinations AI** (tymczasowo) — pierwszy eksperyment z AI do rozpoznawania przepisów z YouTube; szybko zastąpiony Groq ze względu na jakość
- **Komponenty React** — `FrameImg`, `RecipeCard`, szkieletowe ładowanie (skeleton), zakładki

### Naprawione błędy
- Hooks violation: `useState` wywoływany wewnątrz `.map()` → wyekstrahowany komponent
- Vite build nie działał na Vercel → tymczasowo serwowany jako statyczny HTML

---

## [v1.x] — 2026-03-16 — Początki: statyczny HTML, pierwsze API

Cały projekt zaczął się jako jeden plik HTML pisany bezpośrednio w przeglądarce GitHub.

### Oś czasu tego dnia (8 godzin intensywnego kodowania)

**11:19** — `Add files via upload` — pierwsza wersja `przepisy.html` (166 linii): statyczna lista przepisów zakodowana ręcznie w HTML, zero JavaScript, zero API

**11:23** — Rename `przepisy.html` → `index.html`

**11:37–11:50** — `v3`, `edit` — pierwsze próby dynamicznego renderowania listy przez JS

**12:02** — `fotki` — dodanie miniaturek YouTube (`img.youtube.com/vi/ID/hqdefault.jpg`) jako statycznych obrazków

**12:44** — `integracje api` — pierwsze integracje API: YouTube oEmbed do pobierania tytułów, Google Sheets jako "baza danych" przepisów

**12:47–12:59** — `ss`, `miniatury` — miniaturki jako klikalny element, hover efekty

**13:56–14:05** — `miniatury interaktywne`, `miniatury interaktywne 2`, `min 3` — interaktywna galeria miniatur z podglądem wideo

**14:09–14:18** — `v4`, `v5`, aktualizacje — filtrowanie po kategoriach, poprawki układu

**14:34** — `v6` — wyszukiwarka składników

**14:38** — `v7 yt` — osadzenie YouTube iframe po kliknięciu miniaturki, podstawowy player

**15:11** — `Finall?` — próba "ostatecznej" wersji (spoiler: to nie był koniec)

**15:20–16:28** — seria drobnych poprawek i testów deploymentu na GitHub Pages

---

## Technologie i API

### Frontend
| Technologia | Wersja | Zastosowanie |
|---|---|---|
| React | 19 | UI, logika komponentów, hooks |
| TypeScript | 5 | Typowanie, bezpieczeństwo kodu |
| Vite | 8 | Bundler, dev server, HMR |
| Tailwind CSS | v4 | Utility-first styling |
| Google Fonts — Nunito | 700/800/900 | Tytuły przepisów |
| Google Fonts — Inter | 400/500/600/700 | Treść |

### Backend (Vercel Serverless Functions)
| Plik | Opis |
|---|---|
| `/api/gemini.js` | Analiza wideo YouTube przez Gemini 2.0 Flash (`file_data.file_uri`) |
| `/api/groq.js` | Ekstrakcja przepisu z transkrypcji przez Llama 3.3 70B |
| `/api/transcript.js` | Pobieranie transkrypcji YouTube (youtube-transcript.io) |
| `/api/og.js` | Scraping Open Graph z Facebook/Instagram (`facebookexternalhit` UA) |
| `/api/unsplash.js` | Wyszukiwanie i proxy zdjęć (Unsplash API) |
| `/api/pexels.js` | Wyszukiwanie i proxy zdjęć (Pexels API) |
| `/api/youtube.js` | Wyszukiwanie filmów + resolve handle kanału (YouTube Data API) |

### Zewnętrzne API i usługi
| Usługa | Plan | Limit | Zastosowanie |
|---|---|---|---|
| **Google Gemini 2.0 Flash** | Free | 1 500 req/dzień | Analiza wideo YT — ogląda wideo, wyciąga składniki i kroki |
| **Groq — Llama 3.3 70B** | Free | 14 400 req/dzień | Analiza tekstu/transkrypcji, fallback gdy brak Gemini |
| **youtube-transcript.io** | Płatny | — | Transkrypcje YouTube (napisy automatyczne) |
| **YouTube Data API v3** | Free | quota | Wyszukiwanie filmów, resolve handle kanału |
| **Unsplash API** | Free | 50 req/godz. | Zdjęcia potraw |
| **Pexels API** | Free | 200 req/godz. | Zdjęcia potraw (fallback) |
| **Wikimedia Commons API** | Free/open | — | Zdjęcia z Wikipedii |
| **Wikipedia PL API** | Free/open | — | Miniatura z artykułu wiki danej potrawy |
| **YouTube oEmbed API** | Free/open | — | Pobieranie tytułu wideo bez klucza API |
| **Supabase** | Free tier | 500MB / 2GB transfer | PostgreSQL — przepisy, transkrypcje, notatki |
| **Vercel** | Free tier | 100GB bandwidth | Hosting SPA + serverless functions |
| **GitHub** | Free | — | Repozytorium kodu, historia zmian |

### Baza danych — schemat tabeli `recipes`
| Kolumna | Typ | Opis |
|---|---|---|
| `id` | bigint | Primary key |
| `cat` | text | Kategoria (emoji + nazwa) |
| `name` | text | Nazwa przepisu |
| `link` | text | Link do YouTube / Facebook / Instagram |
| `note` | text | Źródło / autor (np. "community 🤝") |
| `wiki` | text | Tytuł artykułu Wikipedia do wyszukania zdjęcia |
| `q` | text | Zapytanie do wyszukiwarki zdjęć |
| `skladniki` | text[] | Lista składników |
| `kroki` | text[] | Kroki przyrządzania |
| `transcript` | text | Transkrypcja wideo (cache) |
| `added_at` | timestamptz | Data dodania |
| `notatka` | text | Wspólna notatka użytkowników |
| `sprawdzony` | boolean | Czy przepis był przetestowany |
