import { useState, useEffect } from 'react'
import { CardImg } from './CardImg'
import { catColors, catBorder } from '../constants'
import type { Recipe } from '../types'

interface Props {
  r: Recipe
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  adminMode: boolean
  customUrl: string
  onPickRequest: () => void
  isCommunity: boolean
}

export function Card({ r, expanded, onToggle, onEdit, onDelete, adminMode, customUrl, onPickRequest, isCommunity }: Props) {
  const b = catBorder[r.cat] || '#6366f1'
  const [activeTab, setActiveTab] = useState<'skladniki' | 'przepis'>('skladniki')
  useEffect(() => { if (!expanded) setActiveTab('skladniki') }, [expanded])
  const hasKroki = r.kroki && r.kroki.length > 0

  return (
    <div
      onClick={onToggle}
      className="recipe-card flex flex-col overflow-hidden cursor-pointer"
      style={{
        background: catColors[r.cat] || '#fff',
        borderRadius: 16,
        border: `2px solid ${expanded ? b : 'transparent'}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      }}
    >
      <CardImg r={r} customUrl={customUrl} adminMode={adminMode} onPickRequest={onPickRequest} />

      <div className="px-3.5 pt-3 pb-2.5 flex-1">
        <div className="flex items-start gap-1.5">
          <div className="font-bold text-[14px] text-slate-800 leading-snug flex-1">{r.name}</div>
          {isCommunity && (
            <span className="text-[9px] bg-indigo-100 text-indigo-500 rounded-md px-1.5 py-0.5 font-bold whitespace-nowrap flex-shrink-0 mt-0.5">
              🤝
            </span>
          )}
        </div>
        {r.note && (
          <span className="text-[11px] text-slate-500 px-1.5 py-0.5 rounded-[10px] inline-block mt-1.5"
            style={{ background: 'rgba(0,0,0,0.06)' }}>
            {r.note}
          </span>
        )}
        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
          {expanded ? '▲ Zwiń' : hasKroki ? '▼ Składniki / Przepis' : '▼ Składniki'}
          {hasKroki && !expanded && (
            <span className="text-[10px] bg-indigo-500 text-white rounded-[10px] px-1.5 py-px font-bold flex-shrink-0">
              {r.kroki.length} kroków
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-3.5 pb-2.5">
          {hasKroki && (
            <div className="flex gap-1 mb-2 rounded-[10px] p-[3px]" style={{ background: 'rgba(0,0,0,0.06)' }}>
              <button
                className="flex-1 py-1.5 px-1 border-none rounded-lg cursor-pointer text-xs font-bold font-[inherit] transition-all whitespace-nowrap"
                onClick={e => { e.stopPropagation(); setActiveTab('skladniki') }}
                style={{
                  background: activeTab === 'skladniki' ? '#fff' : 'transparent',
                  color: activeTab === 'skladniki' ? '#1e293b' : '#64748b',
                  boxShadow: activeTab === 'skladniki' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                }}
              >🛒 Składniki</button>
              <button
                className="flex-1 py-1.5 px-1 border-none rounded-lg cursor-pointer text-xs font-bold font-[inherit] transition-all whitespace-nowrap"
                onClick={e => { e.stopPropagation(); setActiveTab('przepis') }}
                style={{
                  background: activeTab === 'przepis' ? '#6366f1' : 'transparent',
                  color: activeTab === 'przepis' ? '#fff' : '#64748b',
                  boxShadow: activeTab === 'przepis' ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
                }}
              >📋 Przepis</button>
            </div>
          )}

          {(!hasKroki || activeTab === 'skladniki') && (
            <div className="rounded-[10px] px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.7)' }}>
              <div className="text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Składniki:</div>
              {(r.skladniki || []).map((s, i) => (
                <div key={i} className="text-[13px] text-slate-800 py-[3px] flex gap-1.5">
                  <span className="font-bold flex-shrink-0" style={{ color: b }}>•</span>{s}
                </div>
              ))}
            </div>
          )}

          {hasKroki && activeTab === 'przepis' && (
            <div className="rounded-[10px] px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.7)' }}>
              <div className="text-[11px] font-bold text-slate-600 mb-2 uppercase tracking-wide">Sposób przyrządzania:</div>
              {r.kroki.map((k, i) => (
                <div key={i} className="text-[13px] text-slate-800 py-[5px] flex gap-2"
                  style={{ borderBottom: i < r.kroki.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                  <span className="text-white font-extrabold flex-shrink-0 text-[11px] w-5 h-5 flex items-center justify-center rounded-full mt-px"
                    style={{ background: b }}>
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{k}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {adminMode && (
        <div className="flex gap-1.5 px-3.5 pb-3" onClick={e => e.stopPropagation()}>
          <button className="flex-1 py-[5px] px-2.5 text-xs font-bold rounded-lg border-none cursor-pointer"
            style={{ background: '#e0e7ff', color: '#4338ca' }} onClick={onEdit}>
            ✏️ Edytuj
          </button>
          <button className="flex-1 py-[5px] px-2.5 text-xs font-bold rounded-lg border-none cursor-pointer bg-red-100 text-red-500"
            onClick={() => confirm('Usunąć?') && onDelete()}>
            🗑️ Usuń
          </button>
        </div>
      )}
    </div>
  )
}
