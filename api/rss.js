export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=1800') // 30 min Vercel edge cache

  const cids = [].concat(req.query.cid || []).slice(0, 6)
  if (!cids.length) return res.status(400).json({ error: 'No channel IDs provided' })

  try {
    const fetches = await Promise.all(
      cids.map(cid =>
        fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${cid}`)
          .then(r => (r.ok ? r.text() : null))
          .catch(() => null)
      )
    )

    const videos = []
    for (let i = 0; i < cids.length; i++) {
      const xml = fetches[i]
      if (!xml) continue

      const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
      for (const m of entries.slice(0, 10)) {
        const e = m[1]
        const videoId = (e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) || [])[1]
        const title = (e.match(/<title>([^<]+)<\/title>/) || [])[1]
        const published = (e.match(/<published>([^<]+)<\/published>/) || [])[1]
        if (!videoId) continue

        videos.push({
          id: videoId,
          cid: cids[i],
          title: (title || '')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"'),
          published: published || '',
          thumb: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
          url: `https://www.youtube.com/watch?v=${videoId}`,
        })
      }
    }

    return res.json(videos)
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
