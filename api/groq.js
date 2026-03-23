// Vercel serverless function — proxy dla Groq API (Llama 3.3 70B)
// Klucz GROQ_KEY trzymany w env vars Vercela, nie widoczny w przeglądarce
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.GROQ_KEY;
  if (!key) return res.status(500).json({ error: "GROQ_KEY not configured" });

  const { url, title, transcript } = req.body || {};
  if (!url) return res.status(400).json({ error: "Missing url" });

  const transcriptSection = transcript
    ? `\nTranskrypcja wideo (fragment):\n"${transcript}"`
    : "";

  const prompt = `Masz link do przepisu kulinarnego: ${url}
Tytuł: "${title || ""}"${transcriptSection}

Zdecyduj:
1. Kategorię (DOKŁADNIE jedna z listy): 🐔 Kurczak, 🥩 Schab, 🥩 Karkówka, 🐄 Wołowina, 🌭 Kiełbasa, 🐟 Ryba, 🥘 Wariacje, 🥗 Sałatki, 🥖 Pieczywo
2. Krótką polską nazwę przepisu (max 60 znaków)
3. Wszystkie składniki po polsku z ilościami (np. "500g piersi z kurczaka", "2 ząbki czosnku")
4. 3-5 angielskich słów kluczowych do wyszukiwania zdjęcia
5. Szczegółowy przepis krok po kroku po polsku — ${transcript ? "wyciągnij DOKŁADNIE z transkrypcji, nie pomijaj żadnych detali (temperatury, czasy, techniki)" : "opisz jak najdokładniej"}. Minimum 10 kroków, każdy krok to pełne zdanie opisujące konkretną czynność (max 200 znaków na krok).

Odpowiedz TYLKO poprawnym JSON (bez żadnego dodatkowego tekstu):
{"name":"...","cat":"...","skladniki":["..."],"q":"...","kroki":["...","..."]}`;

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + key,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      return res.status(r.status).json({ error: err?.error?.message || "Groq error " + r.status });
    }

    const d = await r.json();
    const result = JSON.parse(d.choices[0].message.content);
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
