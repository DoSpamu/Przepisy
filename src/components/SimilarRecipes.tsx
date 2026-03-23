import { useState, useEffect } from 'react'
import { resolveHandle, ytSearch } from '../lib/api'
import { gs, ss } from '../lib/storage'
import { YT_CHANNELS, STORAGE_CHAN_KEY } from '../constants'
import type { Recipe, YTVideo } from '../types'

interface Props { recipe: Recipe | null }

interface Row { label: string; videos: YTVideo[] }

export function SimilarRecipes({ recipe }: Props) {
  const [rows,    setRows]   = useState<Row[]>([])
  const [loading, setLoading]= useState(false)
  const [error,   setError]  = useState('')
  const [lastId,  setLastId] = useState<number | null>(null)

  useEffect(() => {
    if (!recipe || recipe.id === lastId) return
    let cancelled = false
    const run = async () => {
      setLoading(true); setError(''); setRows([])
      try {
        let chMap: Record<string, string> = gs(STORAGE_CHAN_KEY) || {}
        for (const ch of YT_CHANNELS) {
          if (!chMap[ch.handle]) {
            const id = await resolveHandle(ch.handle)
            if (id) chMap[ch.handle] = id
          }
        }
        ss(STORAGE_CHAN_KEY, chMap)
        if (cancelled) return
        const q = recipe.name.replace(/[🎬✅😄😅🍺]/g, '').trim()
        const out: Row[] = []
        for (const ch of YT_CHANNELS) {
          const cid = chMap[ch.handle]; if (!cid) continue
          const vids = await ytSearch(q, cid)
          if (vids.length) out.push({ label: ch.label, videos: vids })
          if (cancelled) return
        }
        setRows(out); setLastId(recipe.id)
        if (!out.length) setError('Brak wyników dla tego przepisu.')
      } catch (e: any) { if (!cancelled) setError('Błąd: ' + e.message) }
      finally { if (!cancelled) setLoading(false) }
    }
    run()
    return () => { cancelled = true }
  }, [recipe?.id])

  return (
    <div className="max-w-[980px] mx-auto px-4 pb-8">
      <div className="border-t-2 border-slate-200 pt-6">
        <h2 className="text-lg font-extrabold text-slate-800 mb-1">📺 Podobne przepisy na YouTube</h2>

        {!recipe && (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl px-5 py-7 text-center text-slate-400">
            <div className="text-[28px] mb-2">👆</div>
            <div className="text-[13px] font-semibold text-slate-500">Kliknij przepis aby zobaczyć podobne filmy</div>
            <div className="text-xs mt-1">
              <b className="text-indigo-500">thefoodini · Kocham Gotować · Mrgiboneg · Strzelczyk</b>
            </div>
          </div>
        )}

        {recipe && <>
          <p className="text-xs text-slate-400 mb-4">„<b className="text-slate-500">{recipe.name}</b>"</p>

          {loading && (
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))' }}>
              {Array(8).fill(0).map((_, i) => <div key={i} className="skeleton rounded-xl h-[130px]" />)}
            </div>
          )}

          {error && <div className="bg-orange-50 border border-orange-200 rounded-[10px] px-4 py-3 text-[13px] text-orange-800">{error}</div>}

          {!loading && rows.map(row => (
            <div key={row.label} className="mb-5">
              <div className="text-[13px] font-bold text-indigo-500 mb-2.5">
                <span className="bg-indigo-100 rounded-md px-2 py-0.5">📺 {row.label}</span>
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))' }}>
                {row.videos.map(v => (
                  <a key={v.id} href={v.url} target="_blank" rel="noreferrer"
                    className="no-underline rounded-xl overflow-hidden bg-white block"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <img src={v.thumb} alt={v.title} className="w-full aspect-video object-cover block" />
                    <div className="px-2.5 pt-2 pb-2.5 text-xs font-bold text-slate-800 leading-snug overflow-hidden"
                      style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {v.title}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </>}
      </div>
    </div>
  )
}
