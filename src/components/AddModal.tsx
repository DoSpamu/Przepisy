import { useState } from 'react'
import { fetchYTTitle, fetchYTTranscript, fetchOGData, aiAnalyze } from '../lib/api'
import { getYTId } from '../lib/youtube'
import { ALL_CATS } from '../constants'
import type { Recipe } from '../types'

interface Props {
  onAdd: (recipe: Recipe) => Promise<void>
  onClose: () => void
}

export function AddModal({ onAdd, onClose }: Props) {
  const [step,        setStep]      = useState(0)
  const [url,         setUrl]       = useState('')
  const [error,       setError]     = useState('')
  const [data,        setData]      = useState<any>(null)
  const [name,        setName]      = useState('')
  const [cat,         setCat]       = useState('🥘 Wariacje')
  const [sk,          setSk]        = useState<string[]>([])
  const [kroki,       setKroki]     = useState<string[]>([])
  const [note,        setNote]      = useState('')
  const [loadMsg,     setLoadMsg]   = useState('Analizuję przepis...')
  const [hadTranscript, setHadTrans]= useState(false)
  const [transcript,  setTranscript]= useState('')

  const isFB = (u: string) => /facebook\.com|instagram\.com|fb\.com/.test(u)

  const analyze = async () => {
    if (!url.trim()) return
    setStep(1); setError('')
    try {
      let title = ''
      let trans: string | null = null
      const ytId = getYTId(url)
      if (isFB(url)) {
        setLoadMsg('Pobieranie opisu posta...')
        const og = await fetchOGData(url)
        title = og.title || ''
        trans = og.description || null
        setLoadMsg('Groq analizuje przepis z opisu...')
      } else {
        setLoadMsg('Pobieranie tytułu...')
        title = await fetchYTTitle(url)
        if (ytId) { setLoadMsg('Pobieranie transkrypcji...'); trans = await fetchYTTranscript(ytId) }
        setLoadMsg('Gemini ogląda wideo i wyciąga przepis...')
      }
      setHadTrans(!!trans); setTranscript(trans || '')
      const result = await aiAnalyze(url, title, trans)
      setData(result); setName(result.name || ''); setCat(result.cat || '🥘 Wariacje')
      setSk(result.skladniki || []); setKroki(result.kroki || [])
      setNote('dodane przez społeczność 🤝'); setStep(2)
    } catch (e: any) { setError('Błąd: ' + e.message); setStep(0) }
  }

  const submit = async () => {
    const recipe: Recipe = {
      id: Date.now(), cat, name, link: url, note,
      wiki: '', q: data?.q || name,
      skladniki: sk.filter(s => s.trim()),
      kroki: kroki.filter(k => k.trim()),
      transcript, addedAt: new Date().toISOString(),
    }
    await onAdd(recipe); setStep(3)
  }

  const ytId = getYTId(url)

  return (
    <div className="modal-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(61,28,2,.52)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="modal-content bg-white rounded-2xl p-6 w-full max-w-[540px] max-h-[92vh] overflow-y-auto"
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,.18)' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">{step === 3 ? '✅ Dodano!' : '🤖 Dodaj przepis'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">AI automatycznie rozpozna kategorię i składniki</p>
          </div>
          <button onClick={onClose} className="bg-transparent border-none text-[22px] cursor-pointer text-slate-400">✕</button>
        </div>

        {step === 0 && <>
          <label className="text-[11px] font-bold text-slate-600 block mt-3 mb-1 uppercase tracking-wide">Link YouTube, Facebook lub Instagram</label>
          <input className="w-full px-3 py-2 border-[1.5px] border-slate-200 rounded-[10px] text-[13px] font-[inherit] outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,.12)]"
            value={url} onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && analyze()}
            placeholder="https://youtube.com/... lub https://facebook.com/... lub https://instagram.com/..." />
          {ytId && (
            <div className="mt-2.5 rounded-lg overflow-hidden border-2 border-green-400">
              <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt=""
                className="w-full object-cover block" style={{ maxHeight: 110 }} />
              <div className="text-[11px] text-green-700 px-2 py-1 bg-green-50 font-bold">✅ Link YouTube wykryty</div>
            </div>
          )}
          {error && <div className="mt-2.5 px-3 py-2.5 bg-red-100 rounded-lg text-xs text-red-500">{error}</div>}
          <div className="flex gap-2 mt-4">
            <button className="flex-1 py-2 px-4 bg-indigo-500 hover:bg-indigo-600 text-white border-none rounded-[10px] text-[13px] font-bold cursor-pointer transition-colors"
              onClick={analyze} disabled={!url.trim()}>🤖 Analizuj →</button>
            <button className="py-2 px-4 bg-slate-100 text-slate-500 border-none rounded-[10px] text-[13px] font-bold cursor-pointer"
              onClick={onClose}>Anuluj</button>
          </div>
          <p className="text-[11px] text-slate-400 mt-2.5 text-center">YouTube → Gemini 2.0 Flash · Facebook/Instagram → Groq z opisem posta — darmowe</p>
        </>}

        {step === 1 && (
          <div className="text-center py-9">
            <div className="text-[52px] mb-3 animate-pulse">🤖</div>
            <div className="font-bold text-slate-800 text-[15px] mb-1.5">{loadMsg}</div>
            <div className="text-xs text-slate-400">Groq AI + Gemini — transkrypcja + składniki + przepis</div>
          </div>
        )}

        {step === 2 && <>
          <div className="bg-green-50 border border-green-200 rounded-[10px] px-3 py-2.5 mb-3.5 text-xs text-green-800">
            ✅ AI rozpoznało przepis — sprawdź i popraw jeśli potrzeba:
          </div>
          <label className="text-[11px] font-bold text-slate-600 block mt-3 mb-1 uppercase tracking-wide">Nazwa przepisu</label>
          <input className="w-full px-3 py-2 border-[1.5px] border-slate-200 rounded-[10px] text-[13px] font-[inherit] outline-none focus:border-indigo-500"
            value={name} onChange={e => setName(e.target.value)} />
          <label className="text-[11px] font-bold text-slate-600 block mt-3 mb-1 uppercase tracking-wide">Kategoria</label>
          <select className="w-full px-3 py-2 border-[1.5px] border-slate-200 rounded-[10px] text-[13px] font-[inherit] outline-none focus:border-indigo-500"
            value={cat} onChange={e => setCat(e.target.value)}>
            {ALL_CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <label className="text-[11px] font-bold text-slate-600 block mt-3 mb-1 uppercase tracking-wide">Notatka</label>
          <input className="w-full px-3 py-2 border-[1.5px] border-slate-200 rounded-[10px] text-[13px] font-[inherit] outline-none focus:border-indigo-500"
            value={note} onChange={e => setNote(e.target.value)} />
          <label className="text-[11px] font-bold text-slate-600 block mt-3 mb-1 uppercase tracking-wide">Składniki (jeden na linię)</label>
          <textarea className="w-full px-3 py-2 border-[1.5px] border-slate-200 rounded-[10px] text-[13px] font-[inherit] outline-none focus:border-indigo-500 leading-relaxed resize-y"
            rows={5} value={sk.join('\n')} onChange={e => setSk(e.target.value.split('\n'))} />
          <label className="text-[11px] font-bold text-slate-600 block mt-3 mb-1 uppercase tracking-wide">Sposób przyrządzania — kroki (jeden na linię)</label>
          {hadTranscript
            ? <div className="text-[11px] text-green-700 px-2.5 py-1.5 bg-green-50 rounded-lg mb-1 border border-green-200">✅ Kroki wygenerowane na podstawie transkrypcji wideo</div>
            : <div className="text-[11px] text-amber-700 px-2.5 py-1.5 bg-amber-50 rounded-lg mb-1 border border-amber-200">⚠️ Brak transkrypcji — kroki na podstawie tytułu (mogą być ogólne)</div>
          }
          <textarea className="w-full px-3 py-2 border-[1.5px] border-slate-200 rounded-[10px] text-[13px] font-[inherit] outline-none focus:border-indigo-500 leading-relaxed resize-y"
            rows={6} value={kroki.join('\n')} onChange={e => setKroki(e.target.value.split('\n'))}
            placeholder="Krok 1: Pokrój mięso w plastry..." />
          <div className="flex gap-2 mt-4">
            <button className="flex-1 py-2 px-4 bg-green-500 hover:bg-green-600 text-white border-none rounded-[10px] text-[13px] font-bold cursor-pointer transition-colors"
              onClick={submit}>✅ Dodaj do bazy</button>
            <button className="py-2 px-4 bg-slate-100 text-slate-500 border-none rounded-[10px] text-[13px] font-bold cursor-pointer"
              onClick={() => setStep(0)}>← Wróć</button>
          </div>
        </>}

        {step === 3 && (
          <div className="text-center py-8">
            <div className="text-[56px] mb-3">🎉</div>
            <div className="font-extrabold text-base text-slate-800 mb-1.5">Przepis dodany!</div>
            <div className="text-[13px] text-slate-500 mb-5">Widoczny dla wszystkich odwiedzających</div>
            <button className="py-2 px-4 bg-indigo-500 text-white border-none rounded-[10px] text-[13px] font-bold cursor-pointer"
              onClick={onClose}>Zamknij</button>
          </div>
        )}
      </div>
    </div>
  )
}
