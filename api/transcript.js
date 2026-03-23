// Vercel serverless function — pobiera transkrypcję YouTube bez CORS
// Źródło 1: youtube-transcript.io (wymaga YT_TRANSCRIPT_KEY w env)
// Źródło 2: YouTube page scraping (fallback, bez klucza)
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const { videoId } = req.query;
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return res.status(400).json({ error: "invalid videoId" });
  }

  // ── Źródło 1: youtube-transcript.io ──────────────────────────────
  const key = process.env.YT_TRANSCRIPT_KEY;
  if (key) {
    try {
      const r = await fetch("https://www.youtube-transcript.io/api/transcripts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + key,
        },
        body: JSON.stringify({ ids: [videoId] }),
      });

      if (r.ok) {
        const data = await r.json();
        console.log("yt-transcript.io raw:", JSON.stringify(data).substring(0, 300));

        // Defensywne parsowanie — obsługuje kilka możliwych struktur odpowiedzi
        const item   = Array.isArray(data) ? data[0] : data;
        const tracks = item?.transcripts ?? item?.tracks ?? (Array.isArray(item) ? item : null);
        const first  = Array.isArray(tracks) ? (tracks[0] ?? null) : tracks;
        const segs   =
          first?.segments ??
          first?.transcript ??
          first?.items ??
          (Array.isArray(first) ? first : null) ??
          item?.segments ??
          item?.transcript ??
          [];

        let text = "";
        if (Array.isArray(segs)) {
          text = segs
            .map(s => s.text ?? s.utf8 ?? s.content ?? (typeof s === "string" ? s : ""))
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
        } else if (typeof segs === "string") {
          text = segs.trim();
        }

        if (text.length > 150) {
          return res.json({ text: text.substring(0, 6000), source: "yt-transcript.io" });
        }
      }
    } catch (e) {
      console.error("youtube-transcript.io error:", e.message);
    }
  }

  // ── Źródło 2: YouTube page scraping (fallback) ───────────────────
  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "pl-PL,pl;q=0.9,en;q=0.8",
        "Accept": "text/html,application/xhtml+xml",
      },
    });

    if (!pageRes.ok) return res.json({ text: null });
    const html = await pageRes.text();

    const TAG = "ytInitialPlayerResponse = ";
    const start = html.indexOf(TAG);
    if (start === -1) return res.json({ text: null });

    let depth = 0, i = start + TAG.length, end = -1;
    while (i < html.length) {
      if (html[i] === "{") depth++;
      else if (html[i] === "}") { depth--; if (depth === 0) { end = i + 1; break; } }
      i++;
    }
    if (end === -1) return res.json({ text: null });

    const playerResponse = JSON.parse(html.substring(start + TAG.length, end));
    const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
    if (!tracks.length) return res.json({ text: null });

    const track =
      tracks.find(t => t.languageCode === "pl" && t.kind !== "asr") ||
      tracks.find(t => t.languageCode === "pl") ||
      tracks.find(t => t.languageCode === "en" && t.kind !== "asr") ||
      tracks.find(t => t.languageCode === "en") ||
      tracks[0];

    if (!track?.baseUrl) return res.json({ text: null });

    const capRes = await fetch(track.baseUrl + "&fmt=json3");
    if (!capRes.ok) return res.json({ text: null });

    const capData = await capRes.json();
    const text = (capData.events || [])
      .filter(e => e.segs)
      .flatMap(e => e.segs.map(s => s.utf8 || ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    return res.json({
      text: text.length > 150 ? text.substring(0, 6000) : null,
      source: "yt-scrape",
      lang: track.languageCode,
    });
  } catch (e) {
    console.error("yt-scrape error:", e.message);
    return res.json({ text: null });
  }
};
