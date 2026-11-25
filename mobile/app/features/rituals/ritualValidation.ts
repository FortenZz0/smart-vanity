import { parseCalendarDate } from '../products/expiry'
import type { Ritual, RitualReminder, RitualSchedule, Weekday } from './ritual'

export type RitualInput = {
  name: string
  schedule:
    | { kind: 'daily' }
    | { kind: 'interval'; everyDays: number | string; startsOn: string }
    | { kind: 'weekly'; weekdays: readonly number[] }
  reminders: readonly { id: string; time: string }[]
}

export type RitualInputErrors = {
  name?: 'required'
  everyDays?: 'positiveInteger'
  startsOn?: 'invalidDate'
  weekdays?: 'required' | 'invalidWeekday'
  reminders?: 'required'
  reminderTimes?: Partial<Record<number, 'invalidTime'>>
}

type RitualValidationResult =
  | { valid: true; value: Pick<Ritual, 'name' | 'schedule' | 'reminders'> }
  | { valid: false; errors: RitualInputErrors }

function isWeekday(value: number): value is Weekday {
  return Number.isInteger(value) && value >= 1 && value <= 7
}

function isReminderTime(value: string): value is RitualReminder['time'] {
  return value.length === 5 && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
}

function validateSchedule(
  input: RitualInput['schedule'],
  errors: RitualInputErrors,
): RitualSchedule | undefined {
  switch (input.kind) {
    case 'daily':
      return { kind: 'daily' }
    case 'interval': {
      const days = String(input.everyDays).trim()
      const everyDays = /^\d+$/.test(days) ? Number(days) : NaN
      const startsOn = parseCalendarDate(input.startsOn)

      if (!Number.isSafeInteger(everyDays) || everyDays <= 0) errors.everyDays = 'positiveInteger'
      if (!startsOn) errors.startsOn = 'invalidDate'
      if (startsOn && !errors.everyDays) return { kind: 'interval', everyDays, startsOn }
      return
    }
    case 'weekly': {
      const weekdays = [...new Set(input.weekdays)]
      if (!weekdays.every(isWeekday)) {
        errors.weekdays = 'invalidWeekday'
        return
      }

      const [firstWeekday, ...otherWeekdays] = weekdays
      if (firstWeekday === undefined) {
        errors.weekdays = 'required'
        return
      }

      return { kind: 'weekly', weekdays: [firstWeekday, ...otherWeekdays] }
    }
  }
}

export function validateRitualInput(input: RitualInput): RitualValidationResult {
  const errors: RitualInputErrors = {}
  const name = input.name.trim()
  if (!name) errors.name = 'required'

  const schedule = validateSchedule(input.schedule, errors)
  const reminders: RitualReminder[] = []
  if (input.reminders.length === 0) errors.reminders = 'required'

  input.reminders.forEach(({ id, time }, index) => {
    if (!isReminderTime(time)) {
      (errors.reminderTimes ??= {})[index] = 'invalidTime'
      return
    }

    reminders.push({ id, time })
  })

  const [firstReminder, ...otherReminders] = reminders
  if (!name || !schedule || !firstReminder || errors.reminderTimes) return { valid: false, errors }

  return { valid: true, value: { name, schedule, reminders: [firstReminder, ...otherReminders] } }
}
