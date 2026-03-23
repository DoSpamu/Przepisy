// Vercel serverless function — proxy dla YouTube Data API v3
// Klucz YT_DATA_KEY trzymany w env vars Vercela
// GET /api/youtube?action=resolve&handle=thefoodini
// GET /api/youtube?action=search&query=kurczak+teriyaki&channelId=UCxxx
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.YT_DATA_KEY;
  if (!key) return res.status(500).json({ error: "YT_DATA_KEY not configured" });

  const { action, handle, query, channelId } = req.query;

  try {
    if (action === "resolve") {
      if (!handle) return res.status(400).json({ error: "Missing handle" });
      const r = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(handle)}&key=${key}`
      );
      if (!r.ok) return res.json({ id: null });
      const d = await r.json();
      return res.json({ id: d.items?.[0]?.id || null });
    }

    if (action === "search") {
      if (!query || !channelId) return res.status(400).json({ error: "Missing query or channelId" });
      const r = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&channelId=${channelId}&type=video&maxResults=3&key=${key}`
      );
      if (!r.ok) return res.json([]);
      const d = await r.json();
      const videos = (d.items || []).map(v => ({
        id: v.id.videoId,
        title: v.snippet.title,
        thumb: v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url,
        url: `https://www.youtube.com/watch?v=${v.id.videoId}`,
      }));
      return res.json(videos);
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
