// Vercel serverless function — proxy dla Pexels API
// Klucz PEXELS_KEY trzymany w env vars Vercela
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.PEXELS_KEY;
  if (!key) return res.status(500).json({ error: "PEXELS_KEY not configured" });

  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "Missing query" });

  try {
    const r = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`,
      { headers: { Authorization: key } }
    );
    if (!r.ok) return res.status(r.status).json({ error: "Pexels error " + r.status });

    const d = await r.json();
    const results = (d.photos || []).map(p => ({
      thumb: p.src.medium,
      full: p.src.large,
      title: p.alt || "",
    }));
    return res.json(results);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
