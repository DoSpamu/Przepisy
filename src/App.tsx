import { useState, useEffect } from 'react'
import { Card } from './components/Card'
import { AddModal } from './components/AddModal'
import { ImagePicker } from './components/ImagePicker'
import { RecipeModal } from './components/RecipeModal'
import { SimilarRecipes } from './components/SimilarRecipes'
import { BatchKrokiModal } from './components/BatchKrokiModal'
import { sheetsLoad, sheetsSave, sheetsUpdate, sheetsDelete } from './lib/supabase'
import { gs, ss } from './lib/storage'
import { ALL_CATS, STORAGE_IMG_KEY, STORAGE_ADM_KEY } from './constants'
import type { Recipe } from './types'

export default function App() {
  const [chosen,       setChosen]      = useState<Record<number, string>>(() => gs(STORAGE_IMG_KEY) || {})
  const [community,    setCommunity]   = useState<Recipe[]>([])
  const [adminRecipes, setAdminRecipes]= useState<Recipe[]>(() => gs(STORAGE_ADM_KEY) || [])
  const [activeCat,    setActiveCat]   = useState('Wszystkie')
  const [expanded,     setExpanded]    = useState<number | null>(null)
  const [search,       setSearch]      = useState('')
  const [adminMode,    setAdminMode]   = useState(false)
  const [editModal,    setEditModal]   = useState<Recipe | 'new' | null>(null)
  const [picker,       setPicker]      = useState<Recipe | null>(null)
  const [showAdd,      setShowAdd]     = useState(false)
  const [showBatch,    setShowBatch]   = useState(false)
  const [loading,      setLoading]     = useState(true)

  useEffect(() => ss(STORAGE_IMG_KEY, chosen), [chosen])
  useEffect(() => ss(STORAGE_ADM_KEY, adminRecipes), [adminRecipes])

  useEffect(() => {
    sheetsLoad().then(data => { setCommunity(data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const commIds = new Set(community.filter(r => r.note?.includes('🤝')).map(r => r.id))

  const handleAddCommunity = async (recipe: Recipe) => {
    setCommunity(prev => [...prev, recipe])
    await sheetsSave(recipe)
  }

  const handlePick = (id: number, url: string) => { setChosen(c => ({ ...c, [id]: url })); setPicker(null) }

  const handleUpdateAI = (id: number, data: { kroki: string[], skladniki: string[], transcript: string }) => {
    const upd = (r: Recipe) => r.id === id ? { ...r, ...data } : r
    setCommunity(rs => rs.map(upd))
    setAdminRecipes(rs => rs.map(upd))
  }

  const addOrUpdate = async (form: Recipe) => {
    if (editModal === 'new') {
      setAdminRecipes(rs => [...rs, { ...form, id: Date.now() }])
    } else if (editModal && commIds.has((editModal as Recipe).id)) {
      setCommunity(rs => rs.map(r => r.id === (editModal as Recipe).id ? { ...form, id: r.id } : r))
      await sheetsUpdate({ ...form, id: (editModal as Recipe).id })
    } else if (editModal) {
      setAdminRecipes(rs => rs.map(r => r.id === (editModal as Recipe).id ? { ...form, id: r.id } : r))
    }
    setEditModal(null)
  }

  const deleteRecipe = async (id: number) => {
    if (commIds.has(id)) { setCommunity(rs => rs.filter(r => r.id !== id)); await sheetsDelete(id) }
    else { setAdminRecipes(rs => rs.filter(r => r.id !== id)) }
  }

  const allRecipes = [...adminRecipes, ...community]
  const cats = ['Wszystkie', ...ALL_CATS.filter(c => allRecipes.some(r => r.cat === c))]
  const filtered = allRecipes.filter(r => {
    const mc = activeCat === 'Wszystkie' || r.cat === activeCat
    const ms = r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.skladniki || []).some(s => s.toLowerCase().includes(search.toLowerCase()))
    return mc && ms
  })
  const grouped: Record<string, Recipe[]> = {}
  filtered.forEach(r => { if (!grouped[r.cat]) grouped[r.cat] = []; grouped[r.cat].push(r) })
  const expandedRecipe = allRecipes.find(r => r.id === expanded) || null

  return (
    <div className="min-h-screen pb-10 bg-slate-100" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <div className="text-white px-5 pt-6 pb-5"
        style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#334155 100%)', boxShadow: '0 4px 20px rgba(0,0,0,.2)' }}>
        <div className="max-w-[980px] mx-auto">
          <div className="flex justify-between items-start gap-3 flex-wrap">
            <div>
              <h1 className="text-[26px] font-extrabold tracking-tight">🍳 Moja Baza Przepisów</h1>
              <p className="mt-1 opacity-70 text-[13px]">
                {allRecipes.length} przepisów
                {commIds.size > 0 && (
                  <span className="ml-2 rounded-[10px] px-2 py-px text-[11px]" style={{ background: 'rgba(99,102,241,0.35)' }}>
                    +{commIds.size} community
                  </span>
                )}
                {loading && <span className="ml-2 opacity-60 text-[11px]">⏳ ładuję bazę...</span>}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <button className="py-2 px-4 border-none rounded-[10px] cursor-pointer text-[13px] font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }}
                onClick={() => setShowAdd(true)}>
                🤖 Dodaj przepis
              </button>
              {adminMode && (
                <button className="py-2 px-4 border-none rounded-[10px] cursor-pointer text-[13px] font-bold text-white bg-green-500"
                  onClick={() => setEditModal('new')}>✏️ Ręcznie</button>
              )}
              {adminMode && (
                <button className="py-2 px-4 border-none rounded-[10px] cursor-pointer text-[13px] font-bold"
                  style={{ background: '#f59e0b', color: '#1e293b' }}
                  onClick={() => setShowBatch(true)}>🔄 Uzupełnij kroki</button>
              )}
              <button className="py-2 px-4 border-none rounded-[10px] cursor-pointer text-[13px] font-bold transition-all"
                style={{
                  background: adminMode ? '#f59e0b' : 'rgba(255,255,255,0.15)',
                  color: adminMode ? '#1e293b' : '#fff',
                }}
                onClick={() => setAdminMode(a => !a)}>
                {adminMode ? '✅ Edycja ON' : '⚙️ Edytuj'}
              </button>
            </div>
          </div>
          <input
            className="w-full mt-3.5 px-3.5 py-2.5 rounded-[10px] border-none text-sm outline-none"
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Szukaj przepisu lub składnika..." />
        </div>
      </div>

      {/* Kategorie */}
      <div className="px-5 pb-3.5" style={{ background: '#1e293b' }}>
        <div className="max-w-[980px] mx-auto flex gap-2 flex-wrap pt-3">
          {cats.map(c => (
            <button key={c} onClick={() => setActiveCat(c)}
              className="cat-btn py-1.5 px-4 rounded-full border-none cursor-pointer text-[13px] font-semibold transition-all"
              style={{
                background: activeCat === c ? '#f59e0b' : 'rgba(255,255,255,0.12)',
                color: activeCat === c ? '#1e293b' : 'white',
                boxShadow: activeCat === c ? '0 2px 8px rgba(245,158,11,.4)' : 'none',
              }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Karty */}
      <div className="max-w-[980px] mx-auto mt-5 px-4">
        {Object.keys(grouped).length === 0 && (
          <p className="text-center text-slate-400 mt-10">
            {loading ? '⏳ Ładuję przepisy...' : 'Brak wyników 😶'}
          </p>
        )}
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="mb-8">
            <h2 className="text-lg font-extrabold mb-3 text-slate-800">{cat}</h2>
            <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))' }}>
              {items.map(r => (
                <Card key={r.id} r={r}
                  isCommunity={commIds.has(r.id)}
                  customUrl={chosen[r.id] || ''}
                  onPickRequest={() => setPicker(r)}
                  expanded={expanded === r.id}
                  onToggle={() => setExpanded(expanded === r.id ? null : r.id)}
                  onEdit={() => setEditModal(r)}
                  onDelete={() => deleteRecipe(r.id)}
                  adminMode={adminMode} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <SimilarRecipes recipe={expandedRecipe} />

      <p className="text-center text-[11px] text-slate-400 pb-5">
        🤖 Groq AI (Llama 3.3) · 📝 YT Transkrypcja · 🎬 YT miniatury · 🌐 Wiki · 📷 Unsplash · 🖼️ Pexels · 💾 Supabase
      </p>

      {showAdd    && <AddModal onAdd={handleAddCommunity} onClose={() => setShowAdd(false)} />}
      {picker     && <ImagePicker recipe={picker} onPick={url => handlePick(picker.id, url)} onClose={() => setPicker(null)} />}
      {editModal  && <RecipeModal recipe={editModal === 'new' ? null : editModal} onSave={addOrUpdate} onClose={() => setEditModal(null)} />}
      {showBatch  && <BatchKrokiModal recipes={allRecipes} onUpdate={handleUpdateAI} onClose={() => setShowBatch(false)} />}
    </div>
  )
}
