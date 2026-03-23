// Vercel serverless function — proxy dla Unsplash API
// Klucz UNSPLASH_KEY trzymany w env vars Vercela
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.UNSPLASH_KEY;
  if (!key) return res.status(500).json({ error: "UNSPLASH_KEY not configured" });

  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "Missing query" });

  try {
    const r = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape&client_id=${key}`
    );
    if (!r.ok) return res.status(r.status).json({ error: "Unsplash error " + r.status });

    const d = await r.json();
    const results = (d.results || []).map(p => ({
      thumb: p.urls.small,
      full: p.urls.regular,
      title: p.alt_description || "",
    }));
    return res.json(results);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
