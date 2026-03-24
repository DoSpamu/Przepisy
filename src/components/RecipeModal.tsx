import { useState } from 'react'
import { getYTId } from '../lib/youtube'
import { ALL_CATS } from '../constants'
import type { Recipe } from '../types'

interface Props {
  recipe: Recipe | null
  onSave: (recipe: Recipe) => void
  onClose: () => void
}

const empty: Recipe = { id: 0, name: '', cat: '🐔 Kurczak', link: '', note: '', wiki: '', q: '', skladniki: [''], kroki: [], transcript: '', addedAt: '' }

export function RecipeModal({ recipe, onSave, onClose }: Props) {
  const [f, setF] = useState<Recipe>(recipe ? { ...recipe, skladniki: [...recipe.skladniki] } : { ...empty })

  const set = (k: keyof Recipe, v: unknown) => setF(p => ({ ...p, [k]: v }))
  const setSk = (i: number, v: string) => setF(p => { const s = [...p.skladniki]; s[i] = v; return { ...p, skladniki: s } })
  const addSk = () => setF(p => ({ ...p, skladniki: [...p.skladniki, ''] }))
  const delSk = (i: number) => setF(p => { const s = p.skladniki.filter((_, j) => j !== i); return { ...p, skladniki: s.length ? s : [''] } })
  const submit = () => {
    if (!f.name.trim()) return alert('Podaj nazwę!')
    onSave({ ...f, skladniki: f.skladniki.filter(s => s.trim()) })
  }
  const ytId = getYTId(f.link)

  const inputCls = "w-full px-3 py-2 border-[1.5px] border-slate-200 rounded-[10px] text-[13px] font-[inherit] outline-none focus:border-indigo-500"
  const labelCls = "text-[11px] font-bold text-slate-600 block mt-3 mb-1 uppercase tracking-wide"

  return (
    <div className="modal-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(61,28,2,.52)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="modal-content bg-white rounded-2xl p-6 w-full max-w-[540px] max-h-[92vh] overflow-y-auto"
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,.18)' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-extrabold">{recipe ? '✏️ Edytuj' : '➕ Nowy'}</h2>
          <button onClick={onClose} className="bg-transparent border-none text-[22px] cursor-pointer text-slate-400">✕</button>
        </div>

        <label className={labelCls}>Nazwa *</label>
        <input className={inputCls} value={f.name} onChange={e => set('name', e.target.value)} />

        <label className={labelCls}>Kategoria</label>
        <select className={inputCls} value={f.cat} onChange={e => set('cat', e.target.value)}>
          {ALL_CATS.map(c => <option key={c}>{c}</option>)}
        </select>

        <label className={labelCls}>Link</label>
        <input className={inputCls} value={f.link} onChange={e => set('link', e.target.value)} placeholder="https://..." />
        {ytId && (
          <div className="mt-2 rounded-lg overflow-hidden border-2 border-green-400">
            <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt="" className="w-full object-cover block" style={{ maxHeight: 100 }} />
            <div className="text-[11px] text-green-700 px-2 py-1 bg-green-50 font-bold">✅ Miniatura YouTube wykryta!</div>
          </div>
        )}

        <label className={labelCls}>Notatka</label>
        <input className={inputCls} value={f.note} onChange={e => set('note', e.target.value)} />

        <label className={labelCls}>Wikipedia (opcjonalnie)</label>
        <input className={inputCls} value={f.wiki || ''} onChange={e => set('wiki', e.target.value)} placeholder="np. Zrazy" />

        <label className={labelCls}>Słowa do zdjęcia (ang.)</label>
        <input className={inputCls} value={f.q} onChange={e => set('q', e.target.value)} placeholder="chicken teriyaki bowl" />

        <label className={labelCls}>Składniki</label>
        {f.skladniki.map((s, i) => (
          <div key={i} className="flex gap-1.5 mb-1.5">
            <input className="flex-1 px-3 py-2 border-[1.5px] border-slate-200 rounded-[10px] text-[13px] font-[inherit] outline-none focus:border-indigo-500"
              value={s} onChange={e => setSk(i, e.target.value)} placeholder={`Składnik ${i + 1}`} />
            <button className="py-[5px] px-2.5 bg-red-100 text-red-500 border-none rounded-lg text-xs font-bold cursor-pointer flex-shrink-0"
              onClick={() => delSk(i)}>✕</button>
          </div>
        ))}
        <button className="w-full mt-1 py-[5px] bg-slate-100 text-slate-500 border-none rounded-lg text-xs font-bold cursor-pointer"
          onClick={addSk}>+ Dodaj</button>

        <div className="flex gap-2 mt-4">
          <button className="flex-1 py-2 px-4 bg-indigo-500 text-white border-none rounded-[10px] text-[13px] font-bold cursor-pointer"
            onClick={submit}>{recipe ? '💾 Zapisz' : '➕ Dodaj'}</button>
          <button className="py-2 px-4 bg-slate-100 text-slate-500 border-none rounded-[10px] text-[13px] font-bold cursor-pointer"
            onClick={onClose}>Anuluj</button>
        </div>
      </div>
    </div>
  )
}
