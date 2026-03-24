import { useState, useEffect } from 'react'
import { Card } from './components/Card'
import { AddModal } from './components/AddModal'
import { ImagePicker } from './components/ImagePicker'
import { RecipeModal } from './components/RecipeModal'
import { SimilarRecipes } from './components/SimilarRecipes'
import { ProponowaneTab } from './components/ProponowaneTab'
import { BatchKrokiModal } from './components/BatchKrokiModal'
import { sheetsLoad, sheetsSave, sheetsUpdate, sheetsDelete } from './lib/supabase'
import { gs, ss } from './lib/storage'
import { ALL_CATS, WIEPRZOWINA_CATS, STORAGE_IMG_KEY, STORAGE_ADM_KEY, catBorder } from './constants'
import type { Recipe } from './types'

export default function App() {
  const [chosen,       setChosen]      = useState<Record<number, string>>(() => gs(STORAGE_IMG_KEY) || {})
  const [community,    setCommunity]   = useState<Recipe[]>([])
  const [adminRecipes, setAdminRecipes]= useState<Recipe[]>(() => gs(STORAGE_ADM_KEY) || [])
  const [activeCat,    setActiveCat]   = useState('Wszystkie')
  const [expanded,     setExpanded]    = useState<number | null>(null)
  const [search,       setSearch]      = useState('')
  const [adminMode,    setAdminMode]   = useState(false)
  const [pinModal,     setPinModal]    = useState(false)
  const [pinValue,     setPinValue]    = useState('')
  const [pinError,     setPinError]    = useState(false)
  const [pinLoading,   setPinLoading]  = useState(false)
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

  const handleNoteUpdate = (id: number, notatka: string, sprawdzony: boolean) => {
    const upd = (r: Recipe) => r.id === id ? { ...r, notatka, sprawdzony } : r
    setCommunity(rs => rs.map(upd))
    setAdminRecipes(rs => rs.map(upd))
  }

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

  const handleAdminToggle = () => {
    if (adminMode) { setAdminMode(false); return }
    setPinValue(''); setPinError(false); setPinModal(true)
  }

  const submitPin = async () => {
    setPinLoading(true); setPinError(false)
    try {
      const r = await fetch('/api/admin-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinValue }),
      })
      if (r.ok) { setAdminMode(true); setPinModal(false) }
      else { setPinError(true) }
    } catch { setPinError(true) }
    setPinLoading(false)
  }

  const deleteRecipe = async (id: number) => {
    if (commIds.has(id)) { setCommunity(rs => rs.filter(r => r.id !== id)); await sheetsDelete(id) }
    else { setAdminRecipes(rs => rs.filter(r => r.id !== id)) }
  }

  const allRecipes = [...adminRecipes, ...community]
  const hasWieprzowina = WIEPRZOWINA_CATS.some(c => allRecipes.some(r => r.cat === c))
  const baseCats = ALL_CATS.filter(c => allRecipes.some(r => r.cat === c))
  const cats = [
    'Wszystkie',
    ...(hasWieprzowina ? ['🥩 Wieprzowina'] : []),
    ...baseCats,
    '📺 Proponowane',
  ]
  const filtered = allRecipes.filter(r => {
    const mc = activeCat === 'Wszystkie'
      || (activeCat === '🥩 Wieprzowina' ? WIEPRZOWINA_CATS.includes(r.cat) : r.cat === activeCat)
    const ms = r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.skladniki || []).some(s => s.toLowerCase().includes(search.toLowerCase()))
    return mc && ms
  })
  const grouped: Record<string, Recipe[]> = {}
  filtered.forEach(r => { if (!grouped[r.cat]) grouped[r.cat] = []; grouped[r.cat].push(r) })
  const expandedRecipe = allRecipes.find(r => r.id === expanded) || null

  return (
    <div className="min-h-screen pb-12" style={{ background: '#faf7f2' }}>

      {/* Header */}
      <div className="text-white px-5 pt-8 pb-0 header-pattern"
        style={{
          background: 'linear-gradient(135deg, #7c2d12 0%, #b45309 55%, #d97706 100%)',
          boxShadow: '0 6px 32px rgba(120,45,18,.28)',
        }}>
        <div className="max-w-[980px] mx-auto">
          <div className="flex justify-between items-start gap-3 flex-wrap">
            <div>
              {/* Decorative line above title */}
              <div className="flex items-center gap-2 mb-1.5">
                <div style={{ height: 1, width: 28, background: 'rgba(255,255,255,0.4)' }} />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Domowa Kuchnia
                </span>
                <div style={{ height: 1, width: 28, background: 'rgba(255,255,255,0.4)' }} />
              </div>
              <h1 className="serif text-[36px] font-bold leading-none" style={{ textShadow: '0 2px 12px rgba(0,0,0,.25)', letterSpacing: '-0.5px' }}>
                Moja Kuchnia
              </h1>
              <p className="mt-2 text-[13px] flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.68)' }}>
                <span>{allRecipes.length} przepisów</span>
                {commIds.size > 0 && (
                  <span className="rounded-full px-2.5 py-px text-[11px] font-semibold"
                    style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)' }}>
                    +{commIds.size} wspólnych
                  </span>
                )}
                {loading && <span className="opacity-60 text-[11px]">⏳ ładuję...</span>}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <button className="py-2 px-4 border-none rounded-xl cursor-pointer text-[13px] font-bold text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                onClick={() => setShowAdd(true)}>
                🤖 Dodaj przepis
              </button>
              {adminMode && (
                <button className="py-2 px-4 border-none rounded-xl cursor-pointer text-[13px] font-bold text-white transition-all"
                  style={{ background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.22)' }}
                  onClick={() => setEditModal('new')}>✏️ Ręcznie</button>
              )}
              {adminMode && (
                <button className="py-2 px-4 border-none rounded-xl cursor-pointer text-[13px] font-bold transition-all"
                  style={{ background: '#fbbf24', color: '#7c2d12', border: 'none', boxShadow: '0 2px 8px rgba(251,191,36,0.4)' }}
                  onClick={() => setShowBatch(true)}>🔄 Uzupełnij kroki</button>
              )}
              <button className="py-2 px-4 border-none rounded-xl cursor-pointer text-[13px] font-bold transition-all"
                style={{
                  background: adminMode ? '#fbbf24' : 'rgba(255,255,255,0.14)',
                  color: adminMode ? '#7c2d12' : '#fff',
                  border: adminMode ? 'none' : '1px solid rgba(255,255,255,0.22)',
                }}
                onClick={handleAdminToggle}>
                {adminMode ? '✅ Edycja ON' : '⚙️ Edytuj'}
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-5">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px]" style={{ color: 'rgba(255,255,255,0.5)' }}>🔍</span>
            <input
              className="w-full pl-10 pr-4 py-3 rounded-xl border-none text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: '#fff',
                fontSize: 14,
              }}
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Szukaj przepisu lub składnika..." />
          </div>

          {/* Category tabs — inside header, before the wave */}
          <div className="flex gap-2 flex-wrap mt-5 pb-5">
            {cats.map(c => (
              <button key={c} onClick={() => setActiveCat(c)}
                className="cat-btn py-1.5 px-3.5 rounded-full border-none cursor-pointer text-[13px] font-semibold"
                style={{
                  background: activeCat === c ? '#fff' : 'rgba(255,255,255,0.15)',
                  color: activeCat === c ? '#7c2d12' : 'rgba(255,255,255,0.85)',
                  boxShadow: activeCat === c ? '0 2px 10px rgba(0,0,0,0.2)' : 'none',
                  border: activeCat === c ? 'none' : '1px solid rgba(255,255,255,0.2)',
                  fontWeight: activeCat === c ? 700 : 500,
                }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Wave bottom edge */}
        <div style={{ marginBottom: -1, marginLeft: -20, marginRight: -20 }}>
          <svg viewBox="0 0 1440 48" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"
            style={{ display: 'block', width: '100%', height: 48 }}>
            <path d="M0,32 Q240,8 480,24 Q720,40 960,16 Q1200,-8 1440,20 L1440,48 L0,48 Z" fill="#faf7f2" />
          </svg>
        </div>
      </div>

      {/* Karty lub zakładka Proponowane */}
      {activeCat === '📺 Proponowane' ? (
        <ProponowaneTab />
      ) : (
        <>
          <div className="max-w-[980px] mx-auto mt-6 px-4">
            {Object.keys(grouped).length === 0 && (
              <p className="text-center mt-16" style={{ color: '#a8927a' }}>
                {loading ? '⏳ Ładuję przepisy...' : '🍽️ Brak wyników'}
              </p>
            )}
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <div style={{ width: 5, height: 32, background: (catBorder as Record<string,string>)[cat] || '#b45309', borderRadius: 3, flexShrink: 0 }} />
                  <h2 className="serif font-bold" style={{ fontSize: 22, color: '#2c1a0e', margin: 0 }}>{cat}</h2>
                  <span className="text-[12px] font-semibold" style={{ color: '#c4a882' }}>
                    {items.length} {items.length === 1 ? 'przepis' : 'przepisy'}
                  </span>
                  <div className="flex-1" style={{ height: 1, background: 'linear-gradient(to right, #e8d4b8, transparent)' }} />
                </div>
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))' }}>
                  {items.map(r => (
                    <Card key={r.id} r={r}
                      isCommunity={commIds.has(r.id)}
                      customUrl={chosen[r.id] || ''}
                      onPickRequest={() => setPicker(r)}
                      expanded={expanded === r.id}
                      onToggle={() => setExpanded(expanded === r.id ? null : r.id)}
                      onEdit={() => setEditModal(r)}
                      onDelete={() => deleteRecipe(r.id)}
                      onNoteUpdate={handleNoteUpdate}
                      adminMode={adminMode} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <SimilarRecipes recipe={expandedRecipe} />
        </>
      )}

      <p className="text-center text-[11px] pb-5" style={{ color: '#b8a48a' }}>
        🤖 Groq AI · 📝 YT Transkrypcja · 🌐 Wiki · 📷 Unsplash · 🖼️ Pexels · 💾 Supabase
      </p>

      {pinModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(61,28,2,.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setPinModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-[320px]"
            style={{ boxShadow: '0 24px 64px rgba(0,0,0,.2)' }}
            onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-extrabold text-slate-800 mb-1">🔐 Tryb admina</h2>
            <p className="text-xs text-slate-400 mb-4">Wprowadź PIN żeby odblokować edycję</p>
            <input
              className="w-full px-3 py-2.5 border-[1.5px] rounded-xl text-[15px] font-mono tracking-widest text-center outline-none mb-3"
              style={{
                borderColor: pinError ? '#ef4444' : '#e2e8f0',
                boxShadow: pinError ? '0 0 0 3px rgba(239,68,68,.12)' : undefined,
              }}
              type="password"
              placeholder="••••"
              value={pinValue}
              autoFocus
              onChange={e => { setPinValue(e.target.value); setPinError(false) }}
              onKeyDown={e => e.key === 'Enter' && submitPin()}
            />
            {pinError && <p className="text-xs text-red-500 text-center mb-3">Nieprawidłowy PIN</p>}
            <div className="flex gap-2">
              <button className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-600 text-white border-none rounded-xl text-sm font-bold cursor-pointer transition-colors disabled:opacity-50"
                onClick={submitPin} disabled={pinLoading || !pinValue}>
                {pinLoading ? '...' : 'Odblokuj'}
              </button>
              <button className="py-2 px-4 bg-slate-100 text-slate-500 border-none rounded-xl text-sm font-bold cursor-pointer"
                onClick={() => setPinModal(false)}>Anuluj</button>
            </div>
          </div>
        </div>
      )}

      {showAdd    && <AddModal onAdd={handleAddCommunity} onClose={() => setShowAdd(false)} />}
      {picker     && <ImagePicker recipe={picker} onPick={url => handlePick(picker.id, url)} onClose={() => setPicker(null)} />}
      {editModal  && <RecipeModal recipe={editModal === 'new' ? null : editModal} onSave={addOrUpdate} onClose={() => setEditModal(null)} />}
      {showBatch  && <BatchKrokiModal recipes={allRecipes} onUpdate={handleUpdateAI} onClose={() => setShowBatch(false)} />}
    </div>
  )
}
