import type { CalendarDate } from '../products/product'

// Дни недели по ISO 8601: 1 — понедельник, 7 — воскресенье.
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type RitualSchedule =
  | { kind: 'daily' } // еври дей
  | {
      kind: 'interval'
      // положительное целое число календарных дней между повторениями.
      everyDays: number
      // первый день расписания, от которого отсчитывается интервал.
      startsOn: CalendarDate
    }
  | { // определенные дни недели
      kind: 'weekly'; 
      weekdays: readonly [Weekday, ...Weekday[]] 
    }

type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
type Hour = `${0 | 1}${Digit}` | `2${0 | 1 | 2 | 3}`
type Minute = `${0 | 1 | 2 | 3 | 4 | 5}${Digit}`

export type RitualReminder = {
  id: string
  // Время на устройстве в формате HH:mm.
  time: `${Hour}:${Minute}`
}

export type Ritual = {
  id: string
  name: string
  archivedAt: string | null
  paused: boolean
  skippedThrough: number | null
  schedule: RitualSchedule
  // При создании ритуала список начинается с одного напоминания.
  reminders: readonly [RitualReminder, ...RitualReminder[]]
}
