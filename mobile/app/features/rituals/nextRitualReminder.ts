import type { Ritual } from './ritual'

const millisecondsPerDay = 86_400_000

function localCalendarDay(time: Date): Date {
  const today = new Date(0)
  today.setUTCFullYear(time.getFullYear(), time.getMonth(), time.getDate())
  return today
}

export function getNextRitualReminder(
  { schedule, reminders, skippedThrough }: Ritual,
  now: Date,
) {
  const from = skippedThrough !== null && skippedThrough >= now.getTime() ? new Date(skippedThrough + 1) : now
  // Use UTC for calendar arithmetic so a local day always counts as one day.
  const today = localCalendarDay(from)
  const currentMinute = from.getHours() * 60 + from.getMinutes()
    + (from.getSeconds() * 1000 + from.getMilliseconds()) / 60_000

  const times = reminders.map(({ time }) => time).sort()
  const timeToday = times.find((time) => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes >= currentMinute
  })
  const firstPossibleDay = timeToday === undefined ? 1 : 0
  let daysUntil = firstPossibleDay

  if (schedule.kind === 'weekly') {
    const weekday = today.getUTCDay() || 7
    daysUntil += Math.min(...schedule.weekdays.map((day) =>
      (day - weekday - firstPossibleDay + 7) % 7,
    ))
  } else if (schedule.kind === 'interval') {
    const start = new Date(`${schedule.startsOn}T00:00:00Z`)
    const daysSinceStart = (today.getTime() - start.getTime()) / millisecondsPerDay
    const repetitions = Math.max(0, Math.ceil((daysSinceStart + firstPossibleDay) / schedule.everyDays))
    daysUntil = repetitions * schedule.everyDays - daysSinceStart
  }

  const date = new Date(today.getTime() + daysUntil * millisecondsPerDay)
  const time = daysUntil === 0 ? timeToday : times[0]
  if (!time || !Number.isFinite(date.getTime())) return null

  const [hours, minutes] = time.split(':').map(Number)
  const localTime = new Date(from)
  localTime.setFullYear(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  const timestamp = localTime.setHours(hours, minutes, 0, 0)
  return {
    date,
    daysUntil: (date.getTime() - localCalendarDay(now).getTime()) / millisecondsPerDay,
    time,
    timestamp,
  }
}
