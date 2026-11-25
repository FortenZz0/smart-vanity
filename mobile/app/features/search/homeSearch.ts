export type SearchScope = 'product' | 'ritual'

export function parseHomeSearch(query: string) {
  const text = query.trim()
  const qualifier = /^(product|ritual):\s*/i.exec(text)
  const scope = qualifier ? qualifier[1].toLowerCase() as SearchScope : null
  return { scope, text: qualifier ? text.slice(qualifier[0].length) : text }
}

function normalize(text: string): string {
  return text.toLowerCase().replaceAll('ё', 'е')
}

export function matchHomeSearch<T extends { name: string; archivedAt: string | null; note?: string }>(
  entries: readonly T[],
  query: string,
): T[] {
  const words = normalize(query).split(/\s+/).filter(Boolean)
  return entries.filter(({ name, note = '' }) => {
    const searchable = normalize(`${name} ${note}`)
    return words.every((word) => searchable.includes(word))
  }).sort((a, b) => Number(a.archivedAt !== null) - Number(b.archivedAt !== null))
}
