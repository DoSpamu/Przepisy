import { useState, useRef } from 'react'
import { fetchYTTranscript, aiAnalyze } from '../lib/api'
import { getYTId } from '../lib/youtube'
import { sheetsUpdateAI } from '../lib/supabase'
import type { Recipe } from '../types'

interface Props {
  recipes: Recipe[]
  onUpdate: (id: number, data: { kroki: string[], skladniki: string[], transcript: string }) => void
  onClose: () => void
}

type LogEntry = { id: number; name: string; status: 'loading' | 'done' | 'error'; count?: number; trans?: boolean; fromCache?: boolean; source?: string; msg?: string; message?: string }

export function BatchKrokiModal({ recipes, onUpdate, onClose }: Props) {
  const cancelRef = useRef(false)
  const [status,  setStatus]  = useState<'idle' | 'running' | 'done'>('idle')
  const [current, setCurrent] = useState(0)
  const [log,     setLog]     = useState<LogEntry[]>([])

  // Zamrożona lista przy montowaniu — nie może się kurczyć gdy onUpdate aktualizuje recipes
  const [toProcess] = useState(() => recipes.filter(r => r.link && (!r.kroki || r.kroki.length === 0)))

  const run = async () => {
    cancelRef.current = false
    setStatus('running'); setLog([]); setCurrent(0)
    let done = 0
    for (const r of toProcess) {
      if (cancelRef.current) break
      setLog(l => [...l, { id: r.id, name: r.name, status: 'loading' }])
      try {
        const ytId = getYTId(r.link)
        let transcript = r.transcript || null
        const fromCache = !!transcript
        if (!transcript && ytId) transcript = await fetchYTTranscript(ytId)

        const result = await aiAnalyze(r.link, r.name, transcript)
        const kroki = result.kroki || []
        const skladniki = result.skladniki || r.skladniki || []
        const source: string = result.source || 'groq'

        await sheetsUpdateAI(r.id, { kroki, skladniki, transcript: transcript || '' })
        onUpdate(r.id, { kroki, skladniki, transcript: transcript || '' })
        setLog(l => l.map(e => e.id === r.id ? { ...e, status: 'done', count: kroki.length, trans: !!transcript, fromCache, source } : e))
      } catch (e: any) {
        setLog(l => l.map(e => e.id === r.id ? { ...e, status: 'error', msg: e.message } : e))
      }
      done++; setCurrent(done)
    }
    setStatus('done')
  }

  const pct = toProcess.length ? Math.round((current / toProcess.length) * 100) : 100

  return (
    <div className="modal-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(61,28,2,.52)', backdropFilter: 'blur(4px)' }}
      onClick={status === 'running' ? undefined : onClose}>
      <div className="modal-content bg-white rounded-2xl p-6 w-full max-w-[540px] max-h-[92vh] overflow-y-auto"
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,.18)' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-extrabold">🔄 Uzupełnij kroki przepisów</h2>
          {status !== 'running' && (
            <button onClick={onClose} className="bg-transparent border-none text-[22px] cursor-pointer text-slate-400">✕</button>
          )}
        </div>

        {status === 'idle' && (
          toProcess.length === 0
            ? <div className="py-5 text-center text-green-500 font-bold text-[15px]">✅ Wszystkie przepisy mają już kroki przyrządzania!</div>
            : <>
                <div className="text-[13px] text-slate-500 mb-4 leading-7">
                  Znaleziono <b className="text-slate-800">{toProcess.length} przepisów</b> do zaktualizowania.<br />
                  Groq AI wygeneruje kroki i poprawi składniki na podstawie transkrypcji. Transkrypcje są zapisywane — kolejne uruchomienia korzystają z cache 💾
                </div>
                <div className="bg-slate-50 rounded-[10px] px-3 py-2.5 mb-4 max-h-[180px] overflow-y-auto">
                  {toProcess.map(r => <div key={r.id} className="text-xs text-slate-500 py-0.5">• {r.name}</div>)}
                </div>
                <button className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white border-none rounded-[10px] text-[13px] font-bold cursor-pointer transition-colors"
                  onClick={run}>🚀 Rozpocznij aktualizację ({toProcess.length} przepisów)</button>
              </>
        )}

        {(status === 'running' || status === 'done') && <>
          <div className="mb-3.5">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{current} / {toProcess.length} przepisów</span>
              <span className="font-bold text-indigo-500">{pct}%</span>
            </div>
            <div className="bg-slate-200 rounded-lg h-2">
              <div className="bg-indigo-500 h-2 rounded-lg transition-all duration-400" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="max-h-[320px] overflow-y-auto flex flex-col gap-1 mb-3.5">
            {log.map(e => (
              <div key={e.id} className="text-xs px-2.5 py-1.5 rounded-lg flex gap-2 items-center"
                style={{
                  background: e.status === 'done' ? '#f0fdf4' : e.status === 'error' ? '#fee2e2' : '#f8fafc',
                  color: e.status === 'done' ? '#166534' : e.status === 'error' ? '#991b1b' : '#64748b',
                }}>
                <span className="flex-shrink-0">
                  {e.status === 'done' ? '✅' : e.status === 'error' ? '❌' : <span className="animate-pulse">⏳</span>}
                </span>
                <span className="flex-1 font-semibold">{e.name}</span>
                {e.status === 'done' && <span className="flex-shrink-0 text-[11px] text-green-700">{e.count} kroków {e.fromCache ? '💾' : e.trans ? '📝' : ''} {e.source === 'gemini' ? '🎬' : '🤖'}</span>}
                {e.status === 'error' && <span className="flex-shrink-0 text-[10px]">{e.msg}</span>}
              </div>
            ))}
          </div>

          {status === 'running' && (
            <button className="w-full py-2 bg-red-100 text-red-500 border-none rounded-[10px] text-[13px] font-bold cursor-pointer"
              onClick={() => { cancelRef.current = true }}>⏹ Anuluj</button>
          )}
          {status === 'done' && (
            <button className="w-full py-2 bg-indigo-500 text-white border-none rounded-[10px] text-[13px] font-bold cursor-pointer"
              onClick={onClose}>✅ Gotowe — zamknij</button>
          )}
        </>}
      </div>
    </div>
  )
}
