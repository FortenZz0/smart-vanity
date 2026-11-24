import type { Ritual } from './ritual'

const millisecondsPerDay = 86_400_000

export function getNextRitualReminder({ schedule, reminders }: Ritual, now: Date) {
  // Use UTC for calendar arithmetic so a local day always counts as one day.
  const today = new Date(0)
  today.setUTCFullYear(now.getFullYear(), now.getMonth(), now.getDate())
  const currentMinute = now.getHours() * 60 + now.getMinutes()
    + (now.getSeconds() * 1000 + now.getMilliseconds()) / 60_000

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

  return { date, daysUntil, time }
}
