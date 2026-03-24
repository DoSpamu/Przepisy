import { useState, useEffect, useRef } from 'react'
import { CardImg } from './CardImg'
import { catBorder } from '../constants'
import { saveRecipeNote } from '../lib/supabase'
import type { Recipe } from '../types'

interface Props {
  r: Recipe
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onNoteUpdate: (id: number, notatka: string, sprawdzony: boolean) => void
  adminMode: boolean
  customUrl: string
  onPickRequest: () => void
  isCommunity: boolean
}

export function Card({ r, expanded, onToggle, onEdit, onDelete, onNoteUpdate, adminMode, customUrl, onPickRequest, isCommunity }: Props) {
  const b = catBorder[r.cat] || '#b45309'
  const [activeTab, setActiveTab] = useState<'skladniki' | 'przepis'>('skladniki')
  const [showNotes, setShowNotes] = useState(false)
  const [notatka, setNotatka] = useState(r.notatka || '')
  const [sprawdzony, setSprawdzony] = useState(r.sprawdzony || false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => { if (!expanded) setActiveTab('skladniki') }, [expanded])
  const hasKroki = r.kroki && r.kroki.length > 0

  const handleNotatkaChange = (val: string) => {
    setNotatka(val)
    onNoteUpdate(r.id, val, sprawdzony)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => saveRecipeNote(r.id, val, sprawdzony), 500)
  }

  const handleSprawdzonyToggle = () => {
    const next = !sprawdzony
    setSprawdzony(next)
    onNoteUpdate(r.id, notatka, next)
    saveRecipeNote(r.id, notatka, next)
  }

  return (
    <div
      onClick={onToggle}
      className="recipe-card flex flex-col overflow-hidden cursor-pointer"
      style={{
        background: '#fff',
        borderRadius: 20,
        border: `2px solid ${expanded ? b : sprawdzony ? '#16a34a' : 'transparent'}`,
        boxShadow: expanded
          ? `0 8px 32px rgba(120,60,10,0.18)`
          : sprawdzony
          ? '0 2px 14px rgba(22,163,74,0.18)'
          : '0 2px 14px rgba(120,60,10,0.09)',
      }}
    >
      {/* Image section with title overlay */}
      <div className="relative flex-shrink-0">
        <CardImg r={r} customUrl={customUrl} adminMode={adminMode} onPickRequest={onPickRequest} />

        {/* Sprawdzony badge — top right corner */}
        {sprawdzony && (
          <div
            className="absolute top-2 right-2 flex items-center gap-1 px-2 py-[3px] rounded-full text-[10px] font-extrabold"
            style={{ background: 'rgba(22,163,74,0.92)', color: '#fff', zIndex: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
          >
            ✅ Sprawdzony
          </div>
        )}

        {/* Gradient overlay — bottom two-thirds of image */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent 25%, rgba(10,4,0,0.55) 65%, rgba(10,4,0,0.85) 100%)',
            zIndex: 1,
          }}
        />

        {/* Title + meta on image */}
        <div
          className="absolute bottom-0 left-0 right-0 px-3.5 pb-3 pt-8 pointer-events-none"
          style={{ zIndex: 2 }}
        >
          <div className="flex items-end gap-2">
            <div
              className="serif font-extrabold leading-tight flex-1"
              style={{ fontSize: 17, color: '#fff', textShadow: '0 1px 8px rgba(0,0,0,0.6)', letterSpacing: '-0.01em' }}
            >
              {r.name}
            </div>
            {isCommunity && (
              <span
                className="text-[9px] rounded-full px-2 py-0.5 font-bold flex-shrink-0 mb-0.5"
                style={{ background: 'rgba(251,191,36,0.9)', color: '#7c2d12' }}
              >
                🤝
              </span>
            )}
          </div>

          {r.note && !r.note.includes('🤝') && (
            <div className="text-[11px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {r.note}
            </div>
          )}

          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {expanded ? '▲ Zwiń' : '▼ Rozwiń'}
            </span>
            {hasKroki && !expanded && (
              <span
                className="text-[10px] rounded-full px-2 py-px font-bold"
                style={{ background: `${b}dd`, color: '#fff' }}
              >
                {r.kroki.length} kroków
              </span>
            )}
            <button
              className="pointer-events-auto ml-auto flex items-center gap-0.5 rounded-full px-2 py-[2px] text-[10px] font-bold border-none cursor-pointer transition-all"
              style={{
                background: showNotes ? 'rgba(255,255,255,0.25)' : notatka ? 'rgba(251,191,36,0.85)' : 'rgba(255,255,255,0.15)',
                color: notatka ? '#7c2d12' : 'rgba(255,255,255,0.85)',
              }}
              onClick={e => { e.stopPropagation(); setShowNotes(s => !s) }}
              title="Notatki"
            >
              ✏️ {notatka ? 'notatka' : 'dodaj notatkę'}
            </button>
          </div>
        </div>

        {/* Category color strip at very bottom edge */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{ height: 3, background: b, zIndex: 3 }}
        />
      </div>

      {/* Expanded: ingredients / steps */}
      {expanded && (
        <div className="px-3.5 pt-3 pb-2.5">
          {hasKroki && (
            <div className="flex gap-1 mb-3 rounded-xl p-[3px]" style={{ background: '#f5ede0' }}>
              <button
                className="flex-1 py-1.5 px-1 border-none rounded-lg cursor-pointer text-xs font-bold font-[inherit] transition-all whitespace-nowrap"
                onClick={e => { e.stopPropagation(); setActiveTab('skladniki') }}
                style={{
                  background: activeTab === 'skladniki' ? '#fff' : 'transparent',
                  color: activeTab === 'skladniki' ? '#3d1c02' : '#a8927a',
                  boxShadow: activeTab === 'skladniki' ? '0 1px 4px rgba(120,60,10,0.12)' : 'none',
                }}
              >🛒 Składniki</button>
              <button
                className="flex-1 py-1.5 px-1 border-none rounded-lg cursor-pointer text-xs font-bold font-[inherit] transition-all whitespace-nowrap"
                onClick={e => { e.stopPropagation(); setActiveTab('przepis') }}
                style={{
                  background: activeTab === 'przepis' ? b : 'transparent',
                  color: activeTab === 'przepis' ? '#fff' : '#a8927a',
                  boxShadow: activeTab === 'przepis' ? `0 2px 8px ${b}44` : 'none',
                }}
              >📋 Przepis</button>
            </div>
          )}

          {(!hasKroki || activeTab === 'skladniki') && (
            <div className="rounded-xl px-3 py-3" style={{ background: '#fdfaf5', border: '1px solid #ede0c8' }}>
              <div
                className="text-[10px] font-bold mb-2 uppercase tracking-widest"
                style={{ color: '#b8a48a', letterSpacing: '0.1em' }}
              >
                Składniki
              </div>
              {(r.skladniki || []).map((s, i) => (
                <div key={i} className="text-[13px] py-[4px] flex gap-2 items-start" style={{ color: '#3d1c02' }}>
                  <span className="flex-shrink-0 mt-[3px]" style={{ color: b, fontSize: 8 }}>◆</span>
                  <span className="leading-snug">{s}</span>
                </div>
              ))}
            </div>
          )}

          {hasKroki && activeTab === 'przepis' && (
            <div className="rounded-xl px-3 py-3" style={{ background: '#fdfaf5', border: '1px solid #ede0c8' }}>
              <div
                className="text-[10px] font-bold mb-2.5 uppercase tracking-widest"
                style={{ color: '#b8a48a', letterSpacing: '0.1em' }}
              >
                Sposób przyrządzania
              </div>
              {r.kroki.map((k, i) => (
                <div
                  key={i}
                  className="text-[13px] py-[6px] flex gap-3 items-start"
                  style={{ borderBottom: i < r.kroki.length - 1 ? '1px solid #f0e4d0' : 'none', color: '#3d1c02' }}
                >
                  <span
                    className="text-white font-extrabold flex-shrink-0 text-[11px] flex items-center justify-center rounded-full"
                    style={{ background: b, width: 22, height: 22, minWidth: 22, marginTop: 1 }}
                  >
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{k}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showNotes && (
        <div
          className="px-3.5 pt-3 pb-3"
          style={{ borderTop: '1px solid #f0e4d0', background: '#fffdf7' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#b8a48a' }}>Moja notatka</span>
            <button
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold border-none cursor-pointer transition-all"
              style={{
                background: sprawdzony ? '#16a34a' : '#f0fdf4',
                color: sprawdzony ? '#fff' : '#16a34a',
                border: `1.5px solid ${sprawdzony ? '#16a34a' : '#bbf7d0'}`,
              }}
              onClick={handleSprawdzonyToggle}
            >
              {sprawdzony ? '✅ Sprawdzony!' : '☐ Oznacz jako sprawdzony'}
            </button>
          </div>
          <textarea
            className="w-full rounded-xl px-3 py-2 text-[12px] leading-relaxed resize-none font-[inherit] outline-none"
            style={{
              border: '1.5px solid #ede0c8',
              background: '#fff',
              color: '#3d1c02',
              minHeight: 72,
            }}
            placeholder="Twoje uwagi, zmiany w przepisie, ocena smaku..."
            value={notatka}
            onChange={e => handleNotatkaChange(e.target.value)}
          />
        </div>
      )}

      {adminMode && (
        <div className="flex gap-1.5 px-3.5 pb-3.5" onClick={e => e.stopPropagation()}>
          <button
            className="flex-1 py-[7px] px-2.5 text-xs font-bold rounded-xl border-none cursor-pointer transition-all"
            style={{ background: '#fef3c7', color: '#92600a' }}
            onClick={onEdit}
          >
            ✏️ Edytuj
          </button>
          <button
            className="flex-1 py-[7px] px-2.5 text-xs font-bold rounded-xl border-none cursor-pointer transition-all"
            style={{ background: '#fee2e2', color: '#b91c1c' }}
            onClick={() => confirm('Usunąć?') && onDelete()}
          >
            🗑️ Usuń
          </button>
        </div>
      )}
    </div>
  )
}
