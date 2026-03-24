# Changelog — Moja Kuchnia

Pełna historia projektu od pierwszej linii kodu, sesja po sesji.

---

## [v6.0] — 2026-03-24 — Notatki wspólne, Gemini AI, Facebook/Instagram

### Nowe funkcje
- **Notatki do przepisów** — każda karta ma przycisk ✏️ otwierający panel notatek inline. Tekst i status "Sprawdzony" zapisywane w Supabase — widoczne dla wszystkich użytkowników
- **Sprawdzony przepis** — zielona odznaka ✅ w rogu zdjęcia i zielona ramka karty wyróżniają przetestowane przepisy
- **Gemini 2.0 Flash** — nowy endpoint `/api/gemini.js`; Gemini ogląda wideo YouTube bezpośrednio przez `file_data.file_uri` — widzi co gotujący robi na ekranie, słyszy audio, bez potrzeby transkrypcji
- **Obsługa Facebook/Instagram** — nowy endpoint `/api/og.js`; scraping Open Graph (`og:title`, `og:description`) z nagłówkiem `facebookexternalhit` żeby ominąć bot-detection; opis posta przekazywany jako kontekst do Groq
- **Lepsza czcionka tytułów** — Playfair Display zastąpione przez Nunito (700–900), rozmiar 17px

### Poprawki
- Odświeżenie 9 starych przepisów przez ponowną analizę AI (5 kroków → 10–26 kroków)
- Migracja schematu Supabase: kolumny `notatka TEXT` i `sprawdzony BOOLEAN DEFAULT false`
- Zapis notatki debounce'owany (500ms) — brak zbędnych zapytań przy pisaniu
- **Wyczyszczona historia git** — `git-filter-repo` usunął 4 klucze API z wszystkich ~48 commitów (YouTube, Unsplash, Pexels, Groq były widoczne w starych commitach z v1.x)

---

## [v5.0] — 2026-03-23 (sesja wieczorna) — Gemini jako główne AI + Migracja na Vite + React 19

### Gemini 2.0 Flash jako primary AI dla YouTube
- Gemini ogląda wideo bezpośrednio — daje 15–22 kroków vs 10–15 przez Groq z transkrypcją
- Groq / Llama 3.3 70B pozostał jako fallback (dla nie-YouTube linków i gdy Gemini niedostępny)
- BatchKrokiModal pokazuje źródło: 🎬 Gemini / 🤖 Groq / 💾 cache

### Migracja na Vite + React 19 + TypeScript + Tailwind
Cały projekt przepisany z jednego pliku `index.html` (~1044 linie, React via CDN) na nowoczesny stack. Wymuszone przez wyniki audytu z poprzedniej sesji.

| Przed | Po |
|---|---|
| React 18 via CDN + Babel standalone | React 19 + TypeScript + Vite 8 |
| Jeden plik `index.html` | Komponenty w `src/components/*.tsx` |
| Inline CSS / style obiekty | Tailwind CSS v4 |
| Klucze API widoczne w JS przeglądarki | Vercel env vars (`process.env.*`) |
| Groq / Unsplash / Pexels / YT key w kodzie | Wszystko za `/api/*.js` serverless |

### Naprawione błędy (z tej sesji)
- `youtube-transcript` npm package — zainstalowany, ale nic nie eksportował → `npm uninstall`
- Gemini zwracał 400 dla linków Facebook → dodany `isYouTubeUrl()` check przed wywołaniem Gemini
- `BatchKrokiModal` licznik rósł powyżej 100% (`18/14, 150%`) → `useState(() => recipes.filter(...))` zamraża listę przy montowaniu
- `sheetsUpdate` nie zapisywał `kroki` przy ręcznej edycji → dodane do payloadu

---

## [v4.0] — 2026-03-23 (sesja popołudniowa) — Transkrypcje YouTube + Batch update kroków

### Nowe funkcje
- **YouTube transkrypcje** — endpoint `/api/transcript.js`; youtube-transcript.io jako źródło; transkrypcje cachowane w Supabase (jeden fetch na całe życie przepisu)
- **Kroki przyrządzania** — Groq generuje minimum 10 szczegółowych kroków na podstawie transkrypcji; pełne zdania z ilościami składników
- **Batch update** — modal "🔄 Uzupełnij kroki" procesujący wszystkie przepisy bez kroków; progress bar, log z ikonami źródła, możliwość anulowania
- Nowe kolumny `kroki` (text[]) i `transcript` (text) w Supabase

### Naprawione błędy
- Vercel CDN cachował `/api/transcript` → `Cache-Control: no-store`
- Odpowiedzi 304 Not Modified → cache-busting `?_=Date.now()`
- `package.json` z `"type":"module"` wymagał ES module syntax w plikach `/api/`

---

## [v3.0] — sesja MCP audit — Bugfixes + UX + Playwright

Sesja z użyciem 5 narzędzi MCP równolegle: Playwright, Supabase, Vercel, Context7.

### 4 naprawione bugi (znalezione przez audyt)
1. **deleteRecipe** usuwał przepis tylko z lokalnego stanu — brakowało `await sheetsDelete()` do Supabase
2. **Edycja community recipes** była tracona po odświeżeniu — brak `sheetsUpdate()` dla persist
3. **BatchKrokiModal** reprocessował przepisy które już miały kroki — naprawiony warunek filtra
4. **Brak przycisku Anuluj** w BatchKrokiModal — dodany mimo limitu API

### Nowe elementy UI
- Badge "N kroków" na kartach przepisów (fioletowy) — widoczny status uzupełnienia
- Poprawiona kolejność kategorii — respektuje `ALL_CATS` zamiast losowej kolejności z Set

### Wyniki audytu Playwright
- Screenshot ujawnił że 30/41 przepisów nie miało kroków → zainicjowało sesję z transkrypcjami
- Supabase query: `SELECT id, name FROM recipes WHERE kroki IS NULL OR array_length(kroki,1)=0`
- Vercel: 19 ostatnich deploymentów w stanie READY, brak błędów przez 7 dni

---

## [v2.0] — sesja audytu bezpieczeństwa — Context7 + wykrycie długu technicznego

### Audyt z Context7 MCP

Załadowane dokumentacje przez Context7: React 19 (Compiler, Concurrent rendering), Vite 8 (Rolldown/Rust, 10–30× szybszy niż Rollup).

### Krytyczne problemy znalezione
- **4 klucze API hardcoded w publicznym HTML**: YouTube Data API, Unsplash, Pexels, Groq — wszystkie widoczne w DevTools → każdy użytkownik mógł je skopiować i używać na cudzy koszt
- `index.html` — 1273 linie monolitu z Babel standalone w przeglądarce (wolne transpilowanie JSX przy każdym ładowaniu)
- `src/App.tsx` — pusty template z `create vite@latest`, nigdy nieużywany; cała aplikacja w `index.html`
- React 18 via CDN mimo React 19 w `package.json`

### Decyzja
Wyniki audytu → bezpośrednia przyczyna migracji na Vite + TypeScript w v5.0

---

## [v1.5] — sesja redesignu — Figma + nowy design kulinarny

### Próba z Figma API
- Cel: wygenerować design przez Figma REST API
- Wynik: Figma API jest **read-only** — można pobierać pliki, nie tworzyć → próba zakończona

### Redesign UI bez Figma
Kompletna zmiana wyglądu z "tech dashboard" na "kulinarny notatnik":

| Element | Przed | Po |
|---|---|---|
| Tło | Zimne `#f8fafc` (slate) | Ciepłe `#faf7f2` (kremowe) |
| Header | Flat szary | Gradient `#7c2d12 → #b45309 → #d97706` |
| Czcionka nagłówków | Inter | Playfair Display (serif) |
| Karty | Flat border | Zdjęcie z gradientem overlay, tytuł na zdjęciu |
| Separator kategorii | Linia | Cookbook-style: kolorowy pasek + ozdobna linia |
| Header krawędź | Prosta | Animowany SVG wave |

### Design tokens z Figma (read-only fetch)
- Kolor wiodący: `#FB9400` (pomarańczowy), akcent: `#7756FC` (fioletowy)
- Fonty: Philosopher (serif), Baloo Bhai, Poppins
- Border radius: 18px, shadow: `0 48px 90px rgba(0,0,0,0.08)`

---

## [v1.0] — sesja wdrożenia — Supabase + Vercel + GitHub

### Migracja z Google Sheets na Supabase

**Dlaczego?** Google Sheets przez Apps Script działał fire-and-forget — brak potwierdzenia zapisu, brak obsługi błędów, CORS problemy.

- Stworzone projekty: Supabase `Apius_XYZ` + Vercel `przepisy` + repo GitHub `DoSpamu/Przepisy`
- 40 przepisów przeniesione z hardcoded tablicy do PostgreSQL
- Nowa tabela `recipes` z RLS (public read + insert — celowo, żeby community mogło dodawać)
- `sheetsLoad()`, `sheetsSave()`, `sheetsUpdate()`, `sheetsDelete()` — pełny CRUD
- Vercel auto-deploy z GitHub push
- URL produkcyjny: https://przepisy-two.vercel.app

---

## [v0.x] — 2026-03-16 — Dzień pierwszy: React z CDN, 8 godzin, ~20 commitów

> Cały v0.x to jeden plik `index.html` pisany bezpośrednio przez edytor GitHub.

**Od pierwszego commitu projekt używał React** — React 18 + ReactDOM + Babel Standalone via CDN, JSX transpilowany w przeglądarce. Nie statyczny HTML.

| Czas | Commit | Co powstało |
|---|---|---|
| 11:19 | `Add files via upload` | `przepisy.html` — 166 linii; ~10 przepisów hardcoded; `useState` dla kategorii, rozwinięcia, wyszukiwarki |
| 11:23 | Rename | `przepisy.html` → `index.html` (GitHub Pages wymaga) |
| 12:02 | `fotki` | Miniaturki YT jako `<img>` (`img.youtube.com/vi/{ID}/hqdefault.jpg`) |
| 12:44 | `integracje api` | **Google Sheets** jako backend (Apps Script); Wikimedia Commons API; Unsplash API; Pexels API; YouTube oEmbed; Image Picker modal (+430 linii) |
| 12:47–14:05 | `miniatury` × 3 | Karuzela ramek wideo (`setInterval`, `useRef`); hover aktywuje animację; `YTFrame` komponent z fallbackiem |
| 14:09 | `v4` | Admin mode — Edytuj / Usuń na kartach; `RecipeModal` |
| 14:34 | `v6` | Wyszukiwarka składników |
| 14:38 | `v7 yt` | YouTube Data API v3; `resolveHandle()` — `@handle` → `channelId`; `ytSearch()` — szukanie w kanale; lista `YT_CHANNELS` (thefoodini, Kocham Gotować, mrgiboneg, Strzelczyk) |
| 15:11 | `Finall?` | `SimilarRecipes`; community recipes (localStorage); `AddModal` 3-krokowy flow; Pollinations AI — *pierwsza próba AI, kilka godzin, zastąpiony Groq* |
| 16:28 | ostatni commit | Seria drobnych poprawek i testów na GitHub Pages |

---

## Technologie i API

### Frontend
| Technologia | Wersja | Zastosowanie |
|---|---|---|
| React | 18 → 19 | UI, logika komponentów, hooks |
| TypeScript | 5 | Typowanie (od v5.0) |
| Vite | 8 | Bundler, dev server (od v5.0) |
| Tailwind CSS | v4 | Stylowanie (od v5.0) |
| Babel Standalone | 7.23 | Transpilacja JSX w przeglądarce (v0.x–v4.x) |
| Google Fonts — Nunito | 700/800/900 | Tytuły przepisów (od v6.0) |
| Google Fonts — Playfair Display | 700/800 | Tytuły przepisów (v1.5–v5.x) |
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
| Usługa | Plan | Limit | Zastosowanie | Status |
|---|---|---|---|---|
| **Google Gemini 2.0 Flash** | Free | 1 500 req/dzień | Analiza wideo YT, ekstrakcja składników i kroków | ✅ aktywny (primary) |
| **Groq — Llama 3.3 70B** | Free | 14 400 req/dzień | Analiza tekstu/transkrypcji, fallback | ✅ aktywny (fallback) |
| **Pollinations AI** | Free | bez limitu | Pierwsza próba AI (kilka godzin) — zła jakość | ❌ wycofany |
| **youtube-transcript** (npm) | Free | — | Próba lokalnych transkrypcji — nic nie eksportował | ❌ odinstalowany |
| **youtube-transcript.io** | Płatny | — | Transkrypcje YouTube przez Vercel proxy | ✅ aktywny |
| **YouTube Data API v3** | Free | quota dzienna | Wyszukiwanie filmów, resolve handle | ✅ aktywny |
| **YouTube oEmbed** | Free/open | — | Pobieranie tytułu wideo bez klucza | ✅ aktywny |
| **Unsplash API** | Free | 50 req/godz. | Zdjęcia potraw | ✅ aktywny |
| **Pexels API** | Free | 200 req/godz. | Zdjęcia potraw | ✅ aktywny |
| **Wikimedia Commons API** | Free/open | — | Zdjęcia z Wikimedia Commons | ✅ aktywny |
| **Wikipedia PL API** | Free/open | — | Miniatura z artykułu danej potrawy | ✅ aktywny |
| **Google Sheets (Apps Script)** | Free | — | Pierwsza baza danych (v0.x) | ❌ zastąpiony Supabase |
| **Supabase** | Free tier | 500MB / 2GB transfer | PostgreSQL — wszystkie dane | ✅ aktywny |
| **Vercel** | Free tier | 100GB bandwidth | Hosting SPA + serverless functions | ✅ aktywny |
| **GitHub** | Free | — | Repozytorium, historia zmian | ✅ aktywny |
| **Figma API** | Free | — | Próba generowania designu — API read-only | ❌ porzucony |

### MCP Tools używane podczas developmentu
| Narzędzie | Zastosowanie |
|---|---|
| **Playwright MCP** | Screenshots, weryfikacja UI, wykrywanie async loading |
| **Context7 MCP** | Dokumentacja React 19, Vite 8, Supabase, Tailwind |
| **Vercel MCP** | Logi deploymentów, status funkcji serverless |

### Baza danych — schemat tabeli `recipes`
| Kolumna | Typ | Dodana | Opis |
|---|---|---|---|
| `id` | bigint | v1.0 | Primary key |
| `cat` | text | v1.0 | Kategoria (emoji + nazwa) |
| `name` | text | v1.0 | Nazwa przepisu |
| `link` | text | v1.0 | Link do YouTube / FB / Instagram |
| `note` | text | v1.0 | Źródło / autor |
| `wiki` | text | v1.0 | Tytuł artykułu Wikipedia |
| `q` | text | v1.0 | Query do wyszukiwarki zdjęć |
| `skladniki` | text[] | v1.0 | Lista składników |
| `added_at` | timestamptz | v1.0 | Data dodania |
| `kroki` | text[] | v4.0 | Kroki przyrządzania |
| `transcript` | text | v4.0 | Transkrypcja YT (cache) |
| `notatka` | text | v6.0 | Wspólna notatka użytkowników |
| `sprawdzony` | boolean | v6.0 | Przepis przetestowany |
