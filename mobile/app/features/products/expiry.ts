import type { CalendarDate, ExpiryInput, Product, ShelfLifeUnit } from './product'

const millisecondsPerDay = 86_400_000

export type ProductExpiry =
  | {
      status: 'unknown'
      expiresOn: null
      remainingDays: null
      remainingMonths: null
    }
  | {
      status: 'expired' | 'today' | 'upcoming'
      expiresOn: CalendarDate
      remainingDays: number
      remainingMonths: number
    }

export function parseCalendarDate(value: string): CalendarDate | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) return null

  const date = toUtcDate(value)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null

  return value as CalendarDate
}

function toUtcDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`)
}

function formatCalendarDate(date: Date): CalendarDate {
  return date.toISOString().slice(0, 10) as CalendarDate
}

export function getLocalToday(): CalendarDate {
  const now = new Date()
  const today = new Date(0)
  today.setUTCFullYear(now.getFullYear(), now.getMonth(), now.getDate())
  return formatCalendarDate(today)
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  // Сначала находим последний день целевого месяца для дат вроде 31 января.
  result.setUTCMonth(date.getUTCMonth() + months + 1, 0)
  result.setUTCDate(Math.min(date.getUTCDate(), result.getUTCDate()))
  return result
}

function addDuration(start: CalendarDate, duration: number, unit: ShelfLifeUnit): Date {
  if (!Number.isSafeInteger(duration) || duration <= 0) {
    throw new RangeError('Expiry duration must be a positive integer')
  }

  const date = toUtcDate(start)
  const result = unit === 'days'
    ? new Date(date.getTime() + duration * millisecondsPerDay)
    : addMonths(date, unit === 'years' ? duration * 12 : duration)
  if (!(result.getUTCFullYear() <= 9999)) {
    throw new RangeError('Expiry date is outside the supported range')
  }

  return result
}

function getShelfExpiry(expiry: ExpiryInput | null): Date | null {
  if (!expiry) return null
  if (expiry.kind === 'date') return toUtcDate(expiry.expiresOn)
  return addDuration(expiry.manufacturedOn, expiry.duration, expiry.unit)
}

function countFullMonths(from: Date, to: Date): number {
  const months = (to.getUTCFullYear() - from.getUTCFullYear()) * 12
    + to.getUTCMonth() - from.getUTCMonth()
  return addMonths(from, months) > to ? months - 1 : months
}

export function getProductExpiry(
  { expiry, openedOn, paoMonths }: Pick<Product, 'expiry' | 'openedOn' | 'paoMonths'>,
  today: CalendarDate = getLocalToday(),
): ProductExpiry {
  const shelfEnd = getShelfExpiry(expiry)
  const paoEnd = openedOn !== null && paoMonths !== null
    ? addDuration(openedOn, paoMonths, 'months')
    : null
  const end = paoEnd && (!shelfEnd || paoEnd < shelfEnd) ? paoEnd : shelfEnd

  if (!end) {
    return { status: 'unknown', expiresOn: null, remainingDays: null, remainingMonths: null }
  }

  const start = toUtcDate(today)
  const remainingDays = (end.getTime() - start.getTime()) / millisecondsPerDay

  return {
    status: remainingDays < 0 ? 'expired' : remainingDays === 0 ? 'today' : 'upcoming',
    expiresOn: formatCalendarDate(end),
    remainingDays,
    remainingMonths: remainingDays > 0 ? countFullMonths(start, end) : 0,
  }
}
