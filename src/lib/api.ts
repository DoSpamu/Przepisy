import type { ImageResult, YTVideo } from '../types'

export async function fetchYTTitle(url: string): Promise<string> {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
    if (r.ok) { const d = await r.json(); return d.title || '' }
  } catch {}
  return ''
}

export async function fetchYTTranscript(videoId: string): Promise<string | null> {
  try {
    const r = await fetch(`/api/transcript?videoId=${videoId}&_=${Date.now()}`)
    if (r.ok) { const d = await r.json(); if (d.text) return d.text }
  } catch {}
  return null
}

const isYouTubeUrl = (url: string) => /youtu\.be|youtube\.com/.test(url)
const isFBUrl = (url: string) => /facebook\.com|instagram\.com|fb\.com/.test(url)

export async function fetchOGData(url: string): Promise<{ title: string; description: string }> {
  try {
    const r = await fetch(`/api/og?url=${encodeURIComponent(url)}`)
    if (r.ok) return r.json()
  } catch {}
  return { title: '', description: '' }
}

export async function aiAnalyze(url: string, title: string, transcript: string | null) {
  // Dla FB/IG — pobierz OG description jako kontekst (opis posta często zawiera składniki)
  if (isFBUrl(url) && !transcript) {
    try {
      const og = await fetchOGData(url)
      if (og.description) transcript = og.description
      if (!title && og.title) title = og.title
    } catch {}
  }

  // Gemini tylko dla YouTube — ogląda wideo bezpośrednio, widzi składniki na ekranie
  // Facebook i inne linki pomijają Gemini i idą od razu do Groq
  if (isYouTubeUrl(url)) {
    try {
      const r = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, title }),
      })
      if (r.ok) {
        const data = await r.json()
        if (data && !data.error) return data
      }
    } catch {}
  }
  // Gemini niedostępny / nie-YouTube — fallback do Groq z transkrypcją

  const r = await fetch('/api/groq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, title, transcript }),
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error('Błąd AI: ' + (err?.error || r.status))
  }
  return r.json()
}

export async function fetchWikimedia(query: string, wikiTitle?: string): Promise<ImageResult[]> {
  const results: ImageResult[] = []
  if (wikiTitle) {
    try {
      const r = await fetch(`https://pl.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}&prop=pageimages&format=json&pithumbsize=600&pilimit=1&origin=*`)
      const d = await r.json()
      const pg = Object.values(d?.query?.pages || {})[0] as any
      if (pg?.thumbnail?.source) results.push({ thumb: pg.thumbnail.source, full: pg.thumbnail.source, title: 'Wikipedia: ' + wikiTitle })
    } catch {}
  }
  try {
    const r = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=15&format=json&origin=*`)
    const d = await r.json()
    const titles = (d?.query?.search || []).map((s: any) => s.title)
    if (titles.length) {
      const r2 = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles.join('|'))}&prop=imageinfo&iiprop=url|thumburl|mime&iiurlwidth=400&format=json&origin=*`)
      const d2 = await r2.json()
      Object.values(d2?.query?.pages || {}).forEach((p: any) => {
        const mime = p.imageinfo?.[0]?.mime || ''
        if (mime.startsWith('image/') && !mime.includes('svg')) {
          const thumb = p.imageinfo?.[0]?.thumburl || p.imageinfo?.[0]?.url
          const full  = p.imageinfo?.[0]?.url
          if (thumb) results.push({ thumb, full, title: p.title?.replace('File:', '') })
        }
      })
    }
  } catch {}
  return results
}

export async function fetchUnsplash(query: string): Promise<ImageResult[]> {
  const r = await fetch(`/api/unsplash?query=${encodeURIComponent(query)}`)
  if (!r.ok) throw new Error('Błąd Unsplash (' + r.status + ')')
  return r.json()
}

export async function fetchPexels(query: string): Promise<ImageResult[]> {
  const r = await fetch(`/api/pexels?query=${encodeURIComponent(query)}`)
  if (!r.ok) throw new Error('Błąd Pexels (' + r.status + ')')
  return r.json()
}

export async function resolveHandle(handle: string): Promise<string | null> {
  const r = await fetch(`/api/youtube?action=resolve&handle=${encodeURIComponent(handle)}`)
  if (!r.ok) return null
  const d = await r.json()
  return d.id || null
}

export async function ytSearch(query: string, channelId: string): Promise<YTVideo[]> {
  const r = await fetch(`/api/youtube?action=search&query=${encodeURIComponent(query)}&channelId=${encodeURIComponent(channelId)}`)
  if (!r.ok) return []
  return r.json()
}
