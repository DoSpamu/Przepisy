// Vercel serverless function — pobiera Open Graph metadata z FB/Instagram/innych
// Używa User-Agent facebookexternalhit żeby omijać bot-detection
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Cache-Control", "no-store");

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing url" });

  try {
    const r = await fetch(decodeURIComponent(url), {
      headers: {
        "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pl-PL,pl;q=0.9,en-US;q=0.7,en;q=0.5",
      },
    });

    if (!r.ok) return res.json({ title: "", description: "" });
    const html = await r.text();

    const og = (prop) => {
      const m =
        html.match(new RegExp(`<meta[^>]+property="og:${prop}"[^>]+content="([^"]*)"`, "i")) ||
        html.match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+property="og:${prop}"`, "i"));
      return (m?.[1] || "")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim();
    };

    return res.json({
      title: og("title"),
      description: og("description"),
    });
  } catch (e) {
    console.error("OG fetch error:", e.message);
    return res.json({ title: "", description: "" });
  }
}
