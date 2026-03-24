import { useState, useEffect } from 'react'
import { fetchWikimedia, fetchUnsplash, fetchPexels } from '../lib/api'
import { getYTId, getYTThumbs } from '../lib/youtube'
import type { Recipe, ImageResult } from '../types'

interface Props {
  recipe: Recipe
  onPick: (url: string) => void
  onClose: () => void
}

const TABS = [
  { id: 'youtube',   label: '🎬 YT',       free: true  },
  { id: 'wikimedia', label: '🌐 Wiki',      free: true  },
  { id: 'unsplash',  label: '📷 Unsplash',  free: false },
  { id: 'pexels',    label: '🖼️ Pexels',    free: false },
  { id: 'manual',    label: '🔗 URL',       free: true  },
]

export function ImagePicker({ recipe, onPick, onClose }: Props) {
  const [tab,      setTab]      = useState('youtube')
  const [query,    setQuery]    = useState(recipe.q || recipe.name || '')
  const [results,  setResults]  = useState<ImageResult[]>([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [selected, setSelected] = useState<number | null>(null)
  const [manualUrl,setManual]   = useState('')

  const ytThumbs = getYTThumbs(recipe.link)
  const ytId     = getYTId(recipe.link)

  const search = async (src: string, q: string) => {
    if (src === 'youtube' || src === 'manual') return
    setLoading(true); setError(''); setResults([]); setSelected(null)
    try {
      let imgs: ImageResult[] = []
      if (src === 'wikimedia')      imgs = await fetchWikimedia(q, recipe.wiki || '')
      else if (src === 'unsplash')  imgs = await fetchUnsplash(q)
      else if (src === 'pexels')    imgs = await fetchPexels(q)
      setResults(imgs)
      if (!imgs.length) setError('Brak wyników — spróbuj innych słów.')
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (tab !== 'youtube' && tab !== 'manual') search(tab, query) }, [tab])

  return (
    <div className="modal-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(61,28,2,.52)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="modal-content bg-white rounded-2xl p-5 w-full max-w-[720px] max-h-[92vh] overflow-y-auto"
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,.18)' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-between mb-3.5">
          <div>
            <h2 className="text-[17px] font-extrabold">📷 Wybierz zdjęcie</h2>
            <div className="text-xs text-slate-500">{recipe.name}</div>
          </div>
          <button onClick={onClose} className="bg-transparent border-none text-[22px] cursor-pointer text-slate-400">✕</button>
        </div>

        <div className="flex gap-1 mb-3.5 bg-slate-100 rounded-xl p-1">
          {TABS.map(t => (
            <button key={t.id}
              className="flex-1 py-1.5 px-1 border-none rounded-lg cursor-pointer text-xs font-bold font-[inherit] transition-all whitespace-nowrap"
              onClick={() => setTab(t.id)}
              style={{
                background: tab === t.id ? '#fff' : 'transparent',
                color: tab === t.id ? '#1e293b' : '#64748b',
                boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}>
              {t.label}
              {t.free && <span className="text-[8px] text-green-600 ml-0.5 font-black">FREE</span>}
            </button>
          ))}
        </div>

        {tab === 'youtube' && (
          ytId ? <>
            <div className="text-[13px] text-slate-600 mb-3 px-2.5 py-2 bg-yellow-50 rounded-lg border border-yellow-200">
              🎬 Miniatura z Twojego filmu:
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {ytThumbs.map((t, i) => (
                <div key={i} className="relative">
                  <img src={t.thumb} alt={t.label}
                    className={`w-full aspect-video object-cover rounded-[10px] cursor-pointer border-[3px] transition-all ${selected === i ? 'border-green-500 shadow-[0_0_0_3px_rgba(34,197,94,.3)]' : 'border-transparent hover:border-indigo-500'}`}
                    onClick={() => setSelected(i)}
                    onError={e => (e.currentTarget.closest('div') as HTMLElement).style.opacity = '.3'} />
                  <div className="text-[10px] text-slate-500 mt-0.5 text-center">{t.label}</div>
                  {selected === i && (
                    <div className="absolute top-1 left-1 bg-green-500 rounded-full w-5 h-5 flex items-center justify-center text-xs text-white font-extrabold">✓</div>
                  )}
                </div>
              ))}
            </div>
          </> : (
            <div className="py-5 text-center text-slate-400 text-[13px]">⚠️ Ten link nie ma miniatury YouTube. Użyj innego źródła.</div>
          )
        )}

        {tab !== 'youtube' && tab !== 'manual' && <>
          <div className="flex gap-2 mb-3">
            <input className="flex-1 px-3 py-2 border-[1.5px] border-slate-200 rounded-[10px] text-[13px] font-[inherit] outline-none focus:border-indigo-500"
              value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search(tab, query)}
              placeholder="Szukaj po polsku lub angielsku..." />
            <button className="py-2 px-3 bg-indigo-500 text-white border-none rounded-[10px] text-[13px] font-bold cursor-pointer whitespace-nowrap"
              onClick={() => search(tab, query)}>🔍</button>
          </div>
          {loading && (
            <div className="grid grid-cols-3 gap-2">
              {Array(9).fill(0).map((_, i) => <div key={i} className="skeleton aspect-[4/3] rounded-lg" />)}
            </div>
          )}
          {error && <div className="text-amber-700 text-[13px] px-3 py-2.5 bg-amber-50 rounded-lg mb-2">{error}</div>}
          {!loading && results.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-2">
              {results.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img.thumb} alt=""
                    className={`w-full aspect-[4/3] object-cover rounded-[10px] cursor-pointer border-[3px] transition-all ${selected === i ? 'border-green-500' : 'border-transparent hover:border-indigo-500'}`}
                    onClick={() => setSelected(i)}
                    onError={e => (e.currentTarget.closest('div') as HTMLElement).style.display = 'none'} />
                  {selected === i && (
                    <div className="absolute top-1.5 left-1.5 bg-green-500 rounded-full w-6 h-6 flex items-center justify-center text-sm text-white font-extrabold">✓</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>}

        {tab === 'manual' && (
          <div>
            <p className="text-[13px] text-slate-600 mb-2.5 leading-relaxed">
              Znajdź zdjęcie na kwestiasmaku.com lub Google.<br />
              <b>Prawy klik → "Kopiuj adres obrazu"</b> → wklej poniżej.
            </p>
            <input className="w-full px-3 py-2 border-[1.5px] border-slate-200 rounded-[10px] text-[13px] font-[inherit] outline-none focus:border-indigo-500"
              value={manualUrl} onChange={e => setManual(e.target.value)} placeholder="https://..." />
            {manualUrl && (
              <div className="mt-2.5 rounded-[10px] overflow-hidden border-2 border-slate-200">
                <img src={manualUrl} alt="podgląd" className="w-full object-cover block" style={{ maxHeight: 180 }}
                  onError={e => (e.currentTarget.style.display = 'none')} />
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 mt-3.5 border-t border-slate-100 pt-3.5">
          {tab === 'manual'
            ? <button className="flex-1 py-2 px-4 bg-indigo-500 text-white border-none rounded-[10px] text-[13px] font-bold cursor-pointer disabled:opacity-40"
                disabled={!manualUrl.trim()} onClick={() => onPick(manualUrl.trim())}>✅ Ustaw URL</button>
            : <button className="flex-1 py-2 px-4 bg-indigo-500 text-white border-none rounded-[10px] text-[13px] font-bold cursor-pointer disabled:opacity-40"
                disabled={selected === null}
                onClick={() => {
                  if (selected === null) return
                  if (tab === 'youtube') onPick(ytThumbs[selected].full)
                  else onPick(results[selected].full)
                }}>✅ Ustaw zdjęcie</button>
          }
          <button className="py-2 px-4 bg-slate-100 text-slate-500 border-none rounded-[10px] text-[13px] font-bold cursor-pointer"
            onClick={onClose}>Anuluj</button>
        </div>
      </div>
    </div>
  )
}
