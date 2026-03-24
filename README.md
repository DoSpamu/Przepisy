# 🍳 Moja Kuchnia

Prywatna baza przepisów kulinarnych z AI — dodaj link do YouTube, Facebooka lub Instagrama, a Gemini/Groq automatycznie wyciągnie składniki i kroki przyrządzania.

**Live:** https://przepisy-two.vercel.app

---

## Co potrafi aplikacja

- **Dodawanie przepisów z linku** — wklej URL z YouTube, Facebook lub Instagram, AI robi resztę
- **Gemini 2.0 Flash** ogląda wideo YouTube bezpośrednio i wyciąga przepis (składniki z ilościami, 10–26 kroków)
- **Groq / Llama 3.3 70B** jako fallback — analizuje transkrypcję lub opis posta z FB/IG
- **Zdjęcia potraw** z Unsplash, Pexels i Wikimedia Commons — wybierasz które pasuje
- **Notatki i "Sprawdzony"** — każdy przepis można opatrzyć notatką i oznaczyć jako przetestowany; widoczne dla wszystkich odwiedzających
- **Filtrowanie** po kategoriach (Kurczak, Wieprzowina, Wołowina, Ryba...) i wyszukiwarka po nazwie/składnikach
- **Tryb admina** chroniony PINem — edycja, usuwanie, ręczne dodawanie, batch update kroków

---

## Stack techniczny

| Warstwa | Technologia |
|---|---|
| Frontend | React 19 + TypeScript + Vite 8 |
| Stylowanie | Tailwind CSS v4 |
| Backend | Vercel Serverless Functions (`/api/*.js`) |
| Baza danych | Supabase (PostgreSQL) |
| Hosting | Vercel |

### Serverless API

| Endpoint | Opis |
|---|---|
| `/api/gemini` | Analiza wideo YouTube przez Gemini 2.0 Flash |
| `/api/groq` | Ekstrakcja przepisu przez Llama 3.3 70B (z transkrypcją/opisem) |
| `/api/transcript` | Transkrypcje YouTube (youtube-transcript.io) |
| `/api/og` | Scraping Open Graph z Facebook/Instagram |
| `/api/unsplash` | Wyszukiwanie zdjęć (Unsplash API) |
| `/api/pexels` | Wyszukiwanie zdjęć (Pexels API) |
| `/api/youtube` | Wyszukiwanie filmów + resolve handle kanału |
| `/api/admin-verify` | Weryfikacja PIN admina (server-side, env var) |

---

## Uruchomienie lokalnie

```bash
git clone https://github.com/DoSpamu/Przepisy.git
cd Przepisy
npm install
```

Utwórz plik `.env.local`:

```env
VITE_SUPABASE_URL=https://fjhbnqbkdpgspucvanhq.supabase.co
VITE_SUPABASE_KEY=<anon key>
```

Zmienne środowiskowe dla API (Vercel → Settings → Environment Variables):

```env
GEMINI_KEY=...
GROQ_KEY=...
UNSPLASH_KEY=...
PEXELS_KEY=...
YT_KEY=...
ADMIN_PIN=...
```

```bash
npm run dev       # dev server na localhost:5173
npm run build     # build produkcyjny
npx vercel dev    # testowanie serverless functions lokalnie
```

---

## Baza danych — tabela `recipes`

| Kolumna | Typ | Opis |
|---|---|---|
| `id` | bigint | Primary key |
| `cat` | text | Kategoria (np. `🐔 Kurczak`) |
| `name` | text | Nazwa przepisu |
| `link` | text | URL źródłowy (YT / FB / IG) |
| `note` | text | Autor / źródło |
| `wiki` | text | Tytuł artykułu Wikipedia (do zdjęcia) |
| `q` | text | Query do wyszukiwarki zdjęć |
| `skladniki` | text[] | Lista składników z ilościami |
| `kroki` | text[] | Kroki przyrządzania |
| `transcript` | text | Transkrypcja YT (cache) |
| `added_at` | timestamptz | Data dodania |
| `notatka` | text | Wspólna notatka użytkowników |
| `sprawdzony` | boolean | Przepis przetestowany |

RLS: anon może SELECT i INSERT. Edycja i usuwanie tylko przez admina (PIN weryfikowany server-side).

---

## Historia projektu

Projekt zaczął się **16 marca 2026** jako pojedynczy plik `przepisy.html` (166 linii, React 18 via CDN, przepisy wpisane ręcznie). Przez 8 godzin intensywnego kodowania urósł do ~1044 linii z Google Sheets backendem, integracją YouTube, image pickerem i trybem admina.

**Kolejne etapy:**

| Data | Co się zmieniło |
|---|---|
| 16.03 | Dzień 1 — React z CDN, Google Sheets, YT thumbnails, Unsplash/Pexels/Wikimedia, admin mode |
| 17.03 | Migracja Google Sheets → Supabase, deploy Vercel + GitHub CI/CD |
| 17.03 | Redesign — ciepła kuchenna paleta, Playfair Display, gradient header, SVG wave |
| 17.03 | Próba Figma API (read-only — porzucone), redesign ręcznie w React |
| 17.03 | Pollinations AI (porzucony) → Groq / Llama 3.3 70B |
| 23.03 | Audyt z Playwright + Context7 MCP — znalezione 4 hardcoded klucze API w publicznym JS |
| 23.03 | Transkrypcje YouTube, batch update kroków, 4 bugi naprawione |
| 23.03 | Migracja na Vite + React 19 + TypeScript + Tailwind, klucze API → Vercel env vars |
| 24.03 | Gemini 2.0 Flash jako primary AI dla YouTube (ogląda wideo bezpośrednio) |
| 24.03 | Obsługa linków FB/Instagram przez Open Graph scraping |
| 24.03 | Notatki i "Sprawdzony" w Supabase (widoczne dla wszystkich) |
| 24.03 | Wyczyszczona historia git (`git-filter-repo`) — usunięte klucze ze wszystkich commitów |
| 24.03 | PIN admin — ochrona edycji/usuwania przed niepowołanymi |

Pełna historia zmian: [CHANGELOG.md](./CHANGELOG.md)

---

## Licencja

Prywatny projekt — brak licencji open source.
