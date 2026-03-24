import { useState, useEffect } from 'react'
import { resolveHandle } from '../lib/api'
import { gs, ss } from '../lib/storage'
import { YT_CHANNELS, STORAGE_CHAN_KEY } from '../constants'

interface Video {
  id: string
  cid: string
  title: string
  published: string
  thumb: string
  url: string
}

const RSS_CACHE_KEY = 'rss_cache_v1'
const TTL = 2 * 60 * 60 * 1000 // 2 godziny

function getRssCache(): { videos: Video[]; ts: number } | null {
  try { return JSON.parse(localStorage.getItem(RSS_CACHE_KEY) || 'null') } catch { return null }
}
function setRssCache(videos: Video[]) {
  try { localStorage.setItem(RSS_CACHE_KEY, JSON.stringify({ videos, ts: Date.now() })) } catch {}
}

export function ProponowaneTab() {
  const [videos,  setVideos]  = useState<Video[]>([])
  const [chMap,   setChMap]   = useState<Record<string, string>>(() => gs(STORAGE_CHAN_KEY) || {})
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    const cached = getRssCache()
    if (cached && Date.now() - cached.ts < TTL) {
      setVideos(cached.videos)
    } else {
      load()
    }
  }, [])

  const load = async () => {
    setLoading(true); setError('')
    try {
      let map: Record<string, string> = gs(STORAGE_CHAN_KEY) || {}
      for (const ch of YT_CHANNELS) {
        if (!map[ch.handle]) {
          const id = await resolveHandle(ch.handle)
          if (id) map[ch.handle] = id
        }
      }
      ss(STORAGE_CHAN_KEY, map)
      setChMap(map)

      const cids = YT_CHANNELS.map(ch => map[ch.handle]).filter(Boolean)
      if (!cids.length) { setError('Brak zapisanych kanałów — kliknij przepis raz żeby zainicjować.'); setLoading(false); return }

      const params = cids.map(cid => `cid=${encodeURIComponent(cid)}`).join('&')
      const r = await fetch(`/api/rss?${params}`)
      if (!r.ok) throw new Error('Błąd pobierania RSS')
      const data = await r.json() as Video[] | { error: string }
      if ('error' in data) throw new Error((data as { error: string }).error)
      const videos = data as Video[]

      setRssCache(videos)
      setVideos(videos)
    } catch (e: any) {
      setError('Błąd: ' + e.message)
    }
    setLoading(false)
  }

  // Group videos by channel (YT_CHANNELS order), newest first
  const grouped = YT_CHANNELS
    .map(ch => ({
      label: ch.label,
      videos: videos
        .filter(v => v.cid === chMap[ch.handle])
        .sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime())
        .slice(0, 8),
    }))
    .filter(g => g.videos.length > 0)

  return (
    <div className="max-w-[980px] mx-auto px-4 pb-8 mt-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800">📺 Proponowane filmy</h2>
          <p className="text-xs text-slate-400 mt-0.5">Najnowsze przepisy z ulubionych kanałów • cache 2h</p>
        </div>
        <button
          onClick={load}
          className="text-xs font-semibold text-indigo-500 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-indigo-100 transition-colors"
        >
          🔄 Odśwież
        </button>
      </div>

      {loading && (
        <div>
          {[1, 2].map(i => (
            <div key={i} className="mb-8">
              <div className="skeleton h-5 w-40 rounded mb-3" />
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))' }}>
                {Array(8).fill(0).map((_, j) => (
                  <div key={j} className="skeleton rounded-xl h-[130px]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-[13px] text-orange-800">
          {error}
        </div>
      )}

      {!loading && grouped.map(group => (
        <div key={group.label} className="mb-8">
          <div className="text-[13px] font-bold text-indigo-500 mb-3">
            <span className="bg-indigo-100 rounded-md px-2 py-0.5">📺 {group.label}</span>
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))' }}>
            {group.videos.map(v => (
              <a key={v.id} href={v.url} target="_blank" rel="noreferrer"
                className="no-underline rounded-xl overflow-hidden bg-white block"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <img src={v.thumb} alt={v.title} className="w-full aspect-video object-cover block" />
                <div className="px-2.5 pt-2 pb-2.5">
                  <div className="text-xs font-bold text-slate-800 leading-snug overflow-hidden"
                    style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {v.title}
                  </div>
                  {v.published && (
                    <div className="text-[10px] text-slate-400 mt-1">
                      {new Date(v.published).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}

      {!loading && !error && grouped.length === 0 && videos.length === 0 && (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl px-5 py-10 text-center">
          <div className="text-[32px] mb-2">📺</div>
          <div className="text-[13px] font-semibold text-slate-500">Kliknij „Odśwież" aby załadować najnowsze filmy</div>
          <div className="text-xs text-slate-400 mt-1">
            <b className="text-indigo-500">thefoodini · Kocham Gotować · Mrgiboneg · Strzelczyk</b>
          </div>
        </div>
      )}
    </div>
  )
}
