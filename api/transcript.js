// Vercel serverless function — pobiera transkrypcję YouTube bez CORS
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const { videoId } = req.query;
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return res.status(400).json({ error: "invalid videoId" });
  }

  try {
    // Pobierz stronę YouTube — zawiera ytInitialPlayerResponse z URL napisów
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "pl-PL,pl;q=0.9,en;q=0.8",
        "Accept": "text/html,application/xhtml+xml",
      }
    });

    if (!pageRes.ok) return res.json({ text: null });
    const html = await pageRes.text();

    // Wyodrębnij ytInitialPlayerResponse (JSON embed w HTML)
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

    // Preferuj: polski manualny → polski auto → angielski manualny → angielski auto → pierwszy dostępny
    const track =
      tracks.find(t => t.languageCode === "pl" && t.kind !== "asr") ||
      tracks.find(t => t.languageCode === "pl") ||
      tracks.find(t => t.languageCode === "en" && t.kind !== "asr") ||
      tracks.find(t => t.languageCode === "en") ||
      tracks[0];

    if (!track?.baseUrl) return res.json({ text: null });

    // Pobierz plik napisów w formacie json3
    const capRes = await fetch(track.baseUrl + "&fmt=json3");
    if (!capRes.ok) return res.json({ text: null });

    const data = await capRes.json();
    const text = (data.events || [])
      .filter(e => e.segs)
      .flatMap(e => e.segs.map(s => s.utf8 || ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    return res.json({
      text: text.length > 150 ? text.substring(0, 6000) : null,
      lang: track.languageCode,
      kind: track.kind || "manual",
    });
  } catch (e) {
    console.error("transcript error:", e.message);
    return res.json({ text: null });
  }
};
