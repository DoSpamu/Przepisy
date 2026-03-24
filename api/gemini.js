// Vercel serverless function — Gemini 2.0 Flash z bezpośrednim YouTube URL
// Gemini ogląda wideo bez potrzeby transkrypcji (file_data.file_uri)
// Darmowy: 1500 req/dzień, 15 req/min
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.GEMINI_KEY;
  if (!key) return res.status(500).json({ error: "GEMINI_KEY not configured" });

  const { url, title } = req.body || {};
  if (!url) return res.status(400).json({ error: "Missing url" });

  const prompt = `Masz link do przepisu kulinarnego: ${url}
Tytuł: "${title || ""}"

Obejrzyj to wideo kulinarne i wyciągnij z niego dokładny przepis.

Zdecyduj:
1. Kategorię (DOKŁADNIE jedna z listy): 🐔 Kurczak, 🥩 Schab, 🥩 Karkówka, 🐄 Wołowina, 🌭 Kiełbasa, 🐟 Ryba, 🥘 Wariacje, 🥗 Sałatki, 🥖 Pieczywo
2. Krótką polską nazwę przepisu (max 60 znaków)
3. Wszystkie składniki po polsku z dokładnymi ilościami pokazanymi w wideo (np. "500g piersi z kurczaka", "2 ząbki czosnku")
4. 3-5 angielskich słów kluczowych do wyszukiwania zdjęcia dania
5. Szczegółowy przepis krok po kroku po polsku — wyciągnij DOKŁADNIE z wideo, uwzględnij wszystkie detale (temperatury, czasy, techniki gotowania). Minimum 10 kroków, każdy krok to pełne zdanie opisujące konkretną czynność (max 200 znaków na krok).

Odpowiedz TYLKO poprawnym JSON (bez żadnego dodatkowego tekstu):
{"name":"...","cat":"...","skladniki":["..."],"q":"...","kroki":["...","..."]}`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { file_data: { file_uri: url } },
              { text: prompt },
            ],
          }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      const msg = err?.error?.message || `Gemini error ${r.status}`;
      console.error("Gemini error:", msg);
      return res.status(r.status).json({ error: msg });
    }

    const d = await r.json();
    const text = d.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(500).json({ error: "Brak treści w odpowiedzi Gemini" });

    const result = JSON.parse(text);
    return res.json({ ...result, source: "gemini" });
  } catch (e) {
    console.error("Gemini handler error:", e.message);
    return res.status(500).json({ error: e.message });
  }
}
