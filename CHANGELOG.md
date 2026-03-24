# Changelog — Moja Kuchnia

Pełna historia projektu od pierwszej linii kodu.

---

## [v5.0] — 2026-03-24 — Notatki wspólne, Gemini AI, Facebook/Instagram

### Nowe funkcje
- **Notatki do przepisów** — każda karta ma przycisk ✏️ otwierający panel notatek inline. Tekst i status "Sprawdzony" zapisywane w Supabase — widoczne dla wszystkich użytkowników po odświeżeniu strony
- **Sprawdzony przepis** — zielona odznaka ✅ w rogu zdjęcia i zielona ramka karty wyróżniają przepisy oznaczone jako przetestowane
- **Gemini 2.0 Flash** — nowy endpoint `/api/gemini.js`; Gemini ogląda wideo YouTube bezpośrednio przez `file_data.file_uri` bez transkrypcji — widzi co gotujący robi na ekranie
- **Obsługa Facebook/Instagram** — nowy endpoint `/api/og.js`; scraping Open Graph (`og:title`, `og:description`) z nagłówkiem `facebookexternalhit` żeby ominąć bot-detection; opis posta przekazywany jako kontekst do Groq
- **Lepsza czcionka tytułów** — Playfair Display zastąpione przez Nunito (700–900), rozmiar 17px

### Poprawki
- Odświeżenie 9 starych przepisów przez ponowną analizę AI (5 kroków → 10–26 kroków)
- Migracja schematu Supabase: kolumny `notatka TEXT` i `sprawdzony BOOLEAN DEFAULT false`
- Zapis notatki debounce'owany (500ms)

---

## [v4.0] — 2026-03-23 (popołudnie) — Migracja na Vite + React 19 + TypeScript + Tailwind

Cały projekt przepisany z jednego pliku `index.html` (~1044 linie, React via CDN) na nowoczesny stack. Żadnych nowych funkcji — wyłącznie jakość kodu i bezpieczeństwo.

| Przed | Po |
|---|---|
| React 18 via CDN + Babel standalone | React 19 + TypeScript + Vite 8 |
| Jeden plik `index.html` | Komponenty w `src/components/*.tsx` |
| Inline CSS / style obiekty | Tailwind CSS v4 |
| Klucze API widoczne w JS przeglądarki | Vercel env vars (`process.env.*`) |
| Groq / Unsplash / Pexels / YT key w kodzie | Wszystko za `/api/*.js` serverless |

### Bezpieczeństwo
- Klucze Groq, Unsplash, Pexels, YouTube przeniesione do zmiennych środowiskowych Vercel
- Żaden klucz API nie trafia do przeglądarki

---

## [v3.0] — 2026-03-23 (rano) — Transkrypcje YouTube + Kroki przyrządzania + Batch update

### Nowe funkcje
- **YouTube transkrypcje** — endpoint `/api/transcript.js`; pobieranie napisów przez youtube-transcript.io jako źródło podstawowe; transkrypcje cachowane w Supabase (jeden fetch na całe życie przepisu)
- **Kroki przyrządzania** — AI (Groq + Llama 3.3 70B) generuje minimum 10 szczegółowych kroków na podstawie transkrypcji; pełne zdania, ilości składników
- **Batch update** — modal "🔄 Uzupełnij kroki" procesujący wszystkie przepisy bez kroków naraz; progress bar, log z ikonami źródła (📝 transkrypcja / 💾 cache / 🤖 groq), możliwość anulowania
- Nowa kolumna `kroki` (text[]) i `transcript` (text) w Supabase

### Naprawione błędy
- Vercel CDN cachował `/api/transcript` → `Cache-Control: no-store`
- Odpowiedzi 304 Not Modified → cache-busting `?_=Date.now()`
- `package.json` z `"type":"module"` wymagał ES module syntax w plikach `/api/`
- `BatchKrokiModal` licznik rósł powyżej 100% (`18/14, 150%`) → `useState(() => recipes.filter(...))` zamiast `const` — lista zamrożona przy montowaniu komponentu
- `sheetsUpdate` nie zapisywał `kroki` przy ręcznej edycji → dodane do payloadu

---

## [v2.0] — 2026-03-17 — Supabase + Groq AI + Pollinations AI (próba)

### Przepisanie backendu: Google Sheets → Supabase

**Dlaczego?** Google Sheets przez Apps Script działał "fire-and-forget" — brak potwierdzenia zapisu, brak obsługi błędów, CORS problemy. Supabase dał prawdziwy CRUD z async/await i czytelną obsługą błędów.

### Nowe funkcje
- **Supabase** — 40 przepisów przeniesione z `localStorage` + hardcoded do PostgreSQL; `sheetsGet()`, `sheetsPost()`, `sheetsUpdate()`, `sheetsDelete()`
- **Groq / Llama 3.3 70B** — AI analizujące URL YouTube i zwracające `name`, `cat`, `skladniki`, `q`, `wiki` w JSON; zastąpił Pollinations AI tego samego dnia
- **Pollinations AI** — pierwszy eksperyment z AI (kilka godzin); darmowe bez klucza, ale jakość ekstrakcji składników słaba → wymieniony na Groq
- **Vercel deployment** — `vercel.json`, `package.json`, pierwsze CI/CD

### Naprawione błędy
- `useState` wywołany wewnątrz `.map()` → hooks violation → wyekstrahowany komponent `YTFrame`/`FrameImg`
- Vite build nie działał na Vercel (brak node_modules w deploy) → tymczasowo serwowany `index.html` jako static

---

## [v1.x] — 2026-03-16 — Dzień pierwszy: React z CDN, Google Sheets, wszystkie API

> Całe v1 to jeden plik `index.html` pisany bezpośrednio przez edytor GitHub. 8 godzin, ~20 commitów.

**WAŻNE:** Od pierwszego commitu projekt używał **React** (nie statycznego HTML) — React 18 + ReactDOM + Babel Standalone ładowane z CDN, JSX transpilowany w przeglądarce.

---

### v1.0 — 11:19 — Pierwszy commit (`przepisy.html`, 166 linii)

- React 18 via CDN (`react.production.min.js`, `babel-standalone`)
- ~10 przepisów zakodowanych ręcznie jako tablica obiektów JS
- `useState` dla: aktywnej kategorii, rozwinięcia karty, wyszukiwarki
- Filtrowanie po kategorii i nazwie
- Responsywna siatka kart (CSS grid)
- Karty z listą składników po rozwinięciu

---

### v1.1 — 11:23–11:50 — Rename + pierwsze poprawki

- Rename `przepisy.html` → `index.html` (GitHub Pages wymaga `index.html`)
- Drobne poprawki UI, dodanie kolejnych przepisów do tablicy

---

### v1.2 — 12:02 — `fotki`

- Miniaturki YouTube jako statyczne `<img>` przez `img.youtube.com/vi/{ID}/hqdefault.jpg`
- Brak klikania, tylko dekoracja

---

### v1.3 — 12:44 — `integracje api` (+430 linii)

Pierwszy duży skok funkcjonalności:

- **Google Sheets** jako backend — `GSHEET_URL` do Apps Script; `sheetsGet()` i `sheetsPost()` dla trwałości danych między sesjami
- **Wikimedia Commons API** — `fetchWikimedia(query, wikiTitle)` szukające zdjęć potraw
- **Unsplash API** — `fetchUnsplash(query, key)` — klucz wklejany przez użytkownika w UI
- **Pexels API** — `fetchPexels(query, key)` — j.w.
- **YouTube oEmbed** — `fetchYTTitle(url)` bez klucza API
- Pole `q` (search query) i `wiki` (tytuł Wikipedia) w każdym przepisie
- Image Picker — modal wyboru zdjęcia z 3 źródeł + ręczny URL

---

### v1.4–v1.6 — 12:47–14:18 — Miniaturki interaktywne (`miniatury`, `v4`, `v5`)

- Miniaturki jako **karuzela ramek wideo** — `setInterval` animujący przełączanie między kadrami YT (`/vi/{id}/1.jpg`, `/2.jpg`, `/3.jpg`)
- `useRef` + `useEffect` do zarządzania timerem karuzeli
- Hover aktywuje animację, hover off zatrzymuje
- `YTFrame` — oddzielny komponent z fallbackiem gdy wideo niedostępne
- **Admin mode** — tryb edycji z przyciskami Edytuj / Usuń na każdej karcie
- `RecipeModal` — modal edycji/dodawania przepisu (nazwa, kategoria, składniki, notatka, link)

---

### v1.7 — 14:34 — `v6`

- **Wyszukiwarka składników** — `includes(search)` po liście składników, nie tylko nazwie
- Przepisanie stylowania kart — ciepła paleta kolorów (#faf7f2, brązy, pomarańcze)
- Kategorie jako przyciski-filtry z emoji

---

### v1.8 — 14:38 — `v7 yt` — YouTube wyszukiwarka

- **YouTube Data API v3** — wyszukiwanie filmów po kanale; `YT_CHANNELS` z listą predefiniowanych kanałów (thefoodini, Kocham Gotować, mrgiboneg, Strzelczyk)
- `resolveHandle(handle)` — resolve `@handle` → `channelId`
- `ytSearch(query, channelId)` — szukanie wideo w kanale
- Wyniki wideo w ImagePickerze obok zdjęć z Unsplash/Pexels

---

### v1.9 — 15:11–16:28 — `Finall?` + seria poprawek

- `SimilarRecipes` — sekcja podobnych przepisów pod rozwinięciem karty (ta sama kategoria)
- Community recipes — przepisy dodane przez użytkowników oznaczone 🤝, tymczasowo w `localStorage` (klucz `community_recipes_local_v1`)
- `AddModal` — pełny 3-krokowy flow: wklej URL → AI analizuje → podgląd i edycja → zapis
- Wszystkie klucze API wciąż hardcoded w pliku JS widocznym w przeglądarce ⚠️
- `Finall?` — commit z pytajnikiem (słusznie — to nie był koniec)

---

## Technologie i API

### Frontend
| Technologia | Wersja | Zastosowanie |
|---|---|---|
| React | 18 → 19 | UI, logika komponentów, hooks |
| TypeScript | 5 | Typowanie (od v4.0) |
| Vite | 8 | Bundler, dev server (od v4.0) |
| Tailwind CSS | v4 | Stylowanie (od v4.0) |
| Babel Standalone | 7.23 | Transpilacja JSX w przeglądarce (v1.x–v3.x) |
| Google Fonts — Nunito | 700/800/900 | Tytuły przepisów (od v5.0) |
| Google Fonts — Inter | 400–700 | Treść |

### Backend (Vercel Serverless Functions)
| Plik | Opis |
|---|---|
| `/api/gemini.js` | Analiza wideo YT przez Gemini 2.0 Flash (`file_data.file_uri`) |
| `/api/groq.js` | Ekstrakcja przepisu z transkrypcji przez Llama 3.3 70B |
| `/api/transcript.js` | Pobieranie transkrypcji YouTube (youtube-transcript.io) |
| `/api/og.js` | Scraping Open Graph z Facebook/Instagram |
| `/api/unsplash.js` | Proxy + wyszukiwanie zdjęć Unsplash |
| `/api/pexels.js` | Proxy + wyszukiwanie zdjęć Pexels |
| `/api/youtube.js` | Wyszukiwanie filmów + resolve handle kanału |

### Zewnętrzne API i usługi
| Usługa | Plan | Limit | Zastosowanie |
|---|---|---|---|
| **Google Gemini 2.0 Flash** | Free | 1 500 req/dzień | Analiza wideo YT, ekstrakcja składników i kroków |
| **Groq — Llama 3.3 70B** | Free | 14 400 req/dzień | Analiza tekstu/transkrypcji, fallback |
| **Pollinations AI** | Free (wycofany) | bez limitu | Pierwszy eksperyment AI — zastąpiony Groq |
| **youtube-transcript.io** | Płatny | — | Transkrypcje YouTube |
| **YouTube Data API v3** | Free | quota dzienna | Wyszukiwanie filmów, resolve handle |
| **YouTube oEmbed** | Free/open | — | Pobieranie tytułu wideo bez klucza |
| **Unsplash API** | Free | 50 req/godz. | Zdjęcia potraw |
| **Pexels API** | Free | 200 req/godz. | Zdjęcia potraw |
| **Wikimedia Commons API** | Free/open | — | Zdjęcia z Wikimedia Commons |
| **Wikipedia PL API** | Free/open | — | Miniatura z artykułu danej potrawy |
| **Google Sheets (Apps Script)** | Free (wycofany) | — | Pierwsza baza danych (v1.x) — zastąpiona Supabase |
| **Supabase** | Free tier | 500MB / 2GB transfer | PostgreSQL — wszystkie dane |
| **Vercel** | Free tier | 100GB bandwidth | Hosting SPA + serverless functions |
| **GitHub** | Free | — | Repozytorium, historia zmian |

### Baza danych — schemat tabeli `recipes`
| Kolumna | Typ | Dodana | Opis |
|---|---|---|---|
| `id` | bigint | v2.0 | Primary key |
| `cat` | text | v2.0 | Kategoria (emoji + nazwa) |
| `name` | text | v2.0 | Nazwa przepisu |
| `link` | text | v2.0 | Link do YouTube / FB / Instagram |
| `note` | text | v2.0 | Źródło / autor |
| `wiki` | text | v2.0 | Tytuł artykułu Wikipedia |
| `q` | text | v2.0 | Query do wyszukiwarki zdjęć |
| `skladniki` | text[] | v2.0 | Lista składników |
| `added_at` | timestamptz | v2.0 | Data dodania |
| `kroki` | text[] | v3.0 | Kroki przyrządzania |
| `transcript` | text | v3.0 | Transkrypcja YT (cache) |
| `notatka` | text | v5.0 | Wspólna notatka użytkowników |
| `sprawdzony` | boolean | v5.0 | Przepis przetestowany |
