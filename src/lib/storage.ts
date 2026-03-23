export function gs<T>(k: string): T | null {
  try { return JSON.parse(localStorage.getItem(k) ?? 'null') } catch { return null }
}

export function ss(k: string, v: unknown): void {
  try { localStorage.setItem(k, JSON.stringify(v)) } catch {}
}
