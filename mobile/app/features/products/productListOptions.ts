import type { ProductExpiry } from './expiry'
import type { Product } from './product'

export const productSortOptions = [
  { value: 'default', label: 'productSortDefault' },
  { value: 'expiry-asc', label: 'productSortExpirySoonest' },
  { value: 'expiry-desc', label: 'productSortExpiryLatest' },
  { value: 'name-asc', label: 'productSortNameAscending' },
  { value: 'name-desc', label: 'productSortNameDescending' },
  { value: 'created-desc', label: 'productSortCreatedNewest' },
  { value: 'created-asc', label: 'productSortCreatedOldest' },
  { value: 'updated-desc', label: 'productSortUpdatedNewest' },
  { value: 'updated-asc', label: 'productSortUpdatedOldest' },
] as const

export const productFilterOptions = [
  { value: 'all', label: 'productFilterAll' },
  { value: 'unopened', label: 'productFilterUnopened' },
  { value: 'opened', label: 'productFilterOpened' },
  { value: 'finished', label: 'productFilterFinished' },
] as const

export type ProductSort = typeof productSortOptions[number]['value']
export type ProductFilter = typeof productFilterOptions[number]['value']

type ProductListItem = { product: Product; expiry: ProductExpiry }

function matchesFilter(product: Product, filter: ProductFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'finished') return product.finished
  return !product.finished && (product.openedOn === null) === (filter === 'unopened')
}

const sortValues = {
  expiry: ({ product, expiry }: ProductListItem) => product.finished ? null : expiry.remainingDays,
  created: ({ product }: ProductListItem) => product.createdAt === null ? null : Date.parse(product.createdAt),
  updated: ({ product }: ProductListItem) => product.updatedAt === null ? null : Date.parse(product.updatedAt),
}

function compareValues(a: number | null, b: number | null, direction: number): number {
  if (a === null) return b === null ? 0 : 1
  if (b === null) return -1
  return direction * (a - b)
}

export function arrangeProducts<T extends ProductListItem>(
  cards: readonly T[], filter: ProductFilter, sort: ProductSort, language: string,
): T[] {
  const matches = cards.filter(({ product }) => matchesFilter(product, filter))
  if (sort === 'default') return matches

  const direction = sort.endsWith('-desc') ? -1 : 1
  const collator = new Intl.Collator(language, { numeric: true, sensitivity: 'base' })
  if (sort === 'name-asc' || sort === 'name-desc') {
    return matches.sort((a, b) => direction * collator.compare(a.product.name, b.product.name))
  }

  const field = sort.startsWith('expiry') ? 'expiry' : sort.startsWith('created') ? 'created' : 'updated'
  const getValue = sortValues[field]
  return matches.sort((a, b) => compareValues(getValue(a), getValue(b), direction)
    || collator.compare(a.product.name, b.product.name))
}
