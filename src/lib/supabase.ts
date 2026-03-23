import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_KEY } from '../constants'
import type { Recipe } from '../types'

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

export async function sheetsLoad(): Promise<Recipe[]> {
  try {
    const { data, error } = await sb.from('recipes').select('*').order('added_at', { ascending: true })
    if (error || !data) return []
    return data.map(r => ({
      id: r.id, cat: r.cat || '', name: r.name || '',
      link: r.link || '', note: r.note || '', wiki: r.wiki || '',
      q: r.q || '', skladniki: r.skladniki || [], kroki: r.kroki || [],
      transcript: r.transcript || '', addedAt: r.added_at,
    }))
  } catch { return [] }
}

export async function sheetsSave(recipe: Recipe): Promise<void> {
  const base = {
    id: recipe.id, cat: recipe.cat || '', name: recipe.name || '',
    link: recipe.link || '', note: recipe.note || 'community 🤝',
    wiki: recipe.wiki || '', q: recipe.q || '',
    skladniki: recipe.skladniki || [], added_at: new Date().toISOString(),
  }
  try {
    await sb.from('recipes').insert({ ...base, kroki: recipe.kroki || [], transcript: recipe.transcript || '' })
  } catch (e: unknown) {
    console.warn('Supabase insert error:', (e as Error)?.message)
    try { await sb.from('recipes').insert(base) } catch (e2) { console.warn('Supabase insert error:', e2) }
  }
}

export async function sheetsUpdate(recipe: Recipe): Promise<void> {
  try {
    const { error } = await sb.from('recipes').update({
      cat: recipe.cat, name: recipe.name, link: recipe.link,
      note: recipe.note, wiki: recipe.wiki || '', q: recipe.q || '',
      skladniki: recipe.skladniki || [],
    }).eq('id', recipe.id)
    if (error) console.warn('sheetsUpdate error:', error)
  } catch (e) { console.warn('sheetsUpdate error:', e) }
}

export async function sheetsUpdateAI(recipeId: number, data: { kroki: string[], skladniki: string[], transcript: string }): Promise<void> {
  try {
    const { error } = await sb.from('recipes').update(data).eq('id', recipeId)
    if (error) console.warn('sheetsUpdateAI error:', error)
  } catch (e) { console.warn('sheetsUpdateAI error:', e) }
}

export async function sheetsDelete(recipeId: number): Promise<void> {
  try {
    const { error } = await sb.from('recipes').delete().eq('id', recipeId)
    if (error) console.warn('sheetsDelete error:', error)
  } catch (e) { console.warn('sheetsDelete error:', e) }
}
