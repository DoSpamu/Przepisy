export interface Recipe {
  id: number
  cat: string
  name: string
  link: string
  note: string
  wiki: string
  q: string
  skladniki: string[]
  kroki: string[]
  transcript: string
  addedAt: string
}

export interface YTVideo {
  id: string
  title: string
  thumb: string
  url: string
}

export interface ImageResult {
  thumb: string
  full: string
  title: string
}
