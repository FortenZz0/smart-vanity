declare const calendarDateBrand: unique symbol

// Календарная дата в формате YYYY-MM-DD без времени и часового пояса.
export type CalendarDate = string & { readonly [calendarDateBrand]: true }

export type ShelfLifeUnit = 'days' | 'months' | 'years'

export type ExpiryInput =
  | { kind: 'date'; expiresOn: CalendarDate }
  | {
      kind: 'shelfLife'
      manufacturedOn: CalendarDate
      duration: number
      unit: ShelfLifeUnit
    }

export type Product = {
  id: string // UUID товара
  name: string
  note: string
  photoId: string | null
  iconId: string | null
  openedOn: CalendarDate | null
  paoMonths: number | null
  expiry: ExpiryInput | null
  finished: boolean
  createdAt: string | null
  updatedAt: string | null
  archivedAt: string | null // Момент переноса в архив в ISO 8601 (UTC).
}
