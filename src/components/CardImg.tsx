import { useState, useEffect, useRef } from 'react'
import { YTFrame } from './YTFrame'
import { getYTId, getYTFrames } from '../lib/youtube'
import { catEmoji } from '../constants'
import type { Recipe } from '../types'

interface Props {
  r: Recipe
  customUrl: string
  adminMode: boolean
  onPickRequest: () => void
}

export function CardImg({ r, customUrl, adminMode, onPickRequest }: Props) {
  const ytId   = getYTId(r.link)
  const frames = ytId ? getYTFrames(ytId) : []
  const N      = frames.length

  const [idx,     setIdx]    = useState(0)
  const [active,  setActive] = useState(false)
  const [ytFail,  setYtFail] = useState(false)
  const [custErr, setCustErr]= useState(false)
  const intRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const progRef = useRef<HTMLDivElement>(null)

  const showCustom = !!(customUrl && !custErr)
  const showYT     = !showCustom && !!(ytId && !ytFail)

  useEffect(() => { setYtFail(false); setCustErr(false); setIdx(0); setActive(false) }, [r.link, customUrl])

  useEffect(() => {
    if (intRef.current) clearInterval(intRef.current)
    if (!showYT || !active) { setIdx(0); return }
    const DUR = 800, TICK = 30; let el = 0, cur = 0
    intRef.current = setInterval(() => {
      el += TICK
      if (progRef.current) progRef.current.style.width = `${((cur + (el / DUR)) / N) * 100}%`
      if (el >= DUR) { el = 0; cur = (cur + 1) % N; setIdx(cur) }
    }, TICK)
    return () => { if (intRef.current) clearInterval(intRef.current) }
  }, [active, showYT, N])

  const badge = showCustom ? { l: 'własne', bg: '#6366f1' } : showYT ? { l: 'YT', bg: '#ef4444' } : null

  return (
    <div
      className="relative overflow-hidden flex-shrink-0"
      style={{ height: 200, background: '#2c1a0e' }}
      onMouseEnter={() => showYT && setActive(true)}
      onMouseLeave={() => showYT && setActive(false)}
      onTouchStart={() => showYT && setActive(true)}
      onTouchEnd={() => showYT && setActive(false)}
    >
      {showCustom && (
        <img src={customUrl} alt={r.name} onError={() => setCustErr(true)}
          className="w-full object-cover block" style={{ height: 200 }} />
      )}

      {showYT && frames.map((f, i) => (
        <YTFrame key={i} src={f.hq} fallback={f.fb}
          onError={() => { if (i === 0) setYtFail(true) }}
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: 200,
            objectFit: 'cover', display: 'block',
            opacity: idx === i ? 1 : 0, transition: 'opacity 0.25s ease',
          }}
        />
      ))}

      {!showCustom && !showYT && (
        <div className="flex flex-col items-center justify-center gap-2 h-full"
          style={{ background: 'linear-gradient(135deg, #3d1c02 0%, #7c3a16 50%, #b45309 100%)' }}>
          <span style={{ fontSize: 56, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>
            {catEmoji[r.cat] || '🍽️'}
          </span>
          {adminMode && (
            <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
              kliknij 📷 aby dodać
            </span>
          )}
        </div>
      )}

      {showYT && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/15">
          <div ref={progRef} className="h-full bg-red-500"
            style={{ width: `${((idx + 1) / N) * 100}%`, transition: active ? 'none' : 'width 0.2s' }} />
        </div>
      )}

      {showYT && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
          {frames.map((_, i) => (
            <div key={i} className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: idx === i ? 20 : 6, background: idx === i ? '#ef4444' : 'rgba(255,255,255,0.45)' }} />
          ))}
        </div>
      )}

      {showYT && active && (
        <div className="absolute top-2 left-2 bg-black/70 text-white rounded-md px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm">
          {frames[idx]?.label || ''}
        </div>
      )}

      {badge && (
        <div className="absolute top-2 text-white rounded-md px-1.5 py-0.5 text-[10px] font-extrabold backdrop-blur-sm"
          style={{ right: 44, background: badge.bg }}>
          {badge.l}
        </div>
      )}

      <a href={r.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
        className="absolute top-2 right-2 bg-black/65 text-white rounded-lg px-2.5 py-1 text-xs font-bold no-underline backdrop-blur-sm">
        ▶
      </a>

      {adminMode && (
        <button onClick={e => { e.stopPropagation(); onPickRequest() }}
          className="absolute bottom-3 left-2 text-white border-none rounded-lg px-2.5 py-1 text-[11px] font-bold cursor-pointer backdrop-blur-sm"
          style={{ background: 'rgba(99,102,241,0.9)' }}>
          📷 Zmień
        </button>
      )}
    </div>
  )
}
