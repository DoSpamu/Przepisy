import { gs, ss } from './storage'

const KEY = 'recipe_notes'

export interface NoteEntry {
  text: string
  sprawdzony: boolean
}

type NotesMap = Record<number, NoteEntry>

export function getNotes(): NotesMap {
  return gs<NotesMap>(KEY) || {}
}

export function getNote(id: number): NoteEntry {
  return getNotes()[id] || { text: '', sprawdzony: false }
}

export function saveNote(id: number, entry: NoteEntry): void {
  const all = getNotes()
  ss(KEY, { ...all, [id]: entry })
}
