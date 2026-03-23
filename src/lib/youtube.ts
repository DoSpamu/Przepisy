export function getYTId(url: string): string | null {
  if (!url) return null
  let m: RegExpMatchArray | null
  m = url.match(/shorts\/([a-zA-Z0-9_-]{11})/); if (m) return m[1]
  m = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/); if (m) return m[1]
  m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/); if (m) return m[1]
  return null
}

export function getYTFrames(id: string) {
  return [
    { hq: `https://img.youtube.com/vi/${id}/hqdefault.jpg`, fb: `https://img.youtube.com/vi/${id}/mqdefault.jpg`, label: 'okładka' },
    { hq: `https://img.youtube.com/vi/${id}/hq1.jpg`,       fb: `https://img.youtube.com/vi/${id}/1.jpg`,         label: '~25% 🎬' },
    { hq: `https://img.youtube.com/vi/${id}/hq2.jpg`,       fb: `https://img.youtube.com/vi/${id}/2.jpg`,         label: '~50% 🎬' },
    { hq: `https://img.youtube.com/vi/${id}/hq3.jpg`,       fb: `https://img.youtube.com/vi/${id}/3.jpg`,         label: '~75% 🎬' },
  ]
}

export function getYTThumbs(url: string) {
  const id = getYTId(url)
  if (!id) return []
  return [
    { thumb: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`, full: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`, label: 'Max' },
    { thumb: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,     full: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,     label: 'HQ' },
    { thumb: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,     full: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,     label: 'MQ' },
  ]
}
