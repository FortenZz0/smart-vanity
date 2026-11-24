import { Capacitor } from '@capacitor/core'
import { LocalNotifications, type LocalNotificationSchema, type Schedule, type Weekday } from '@capacitor/local-notifications'
import { translate } from '../../locales'
import { getNextRitualReminder } from './nextRitualReminder'
import type { Ritual } from './ritual'
import { listRituals } from './ritualRepository'

const scheduledOccurrences = 12
let pendingSync = Promise.resolve()

function scheduledDates(ritual: Ritual, now: Date): Schedule[] {
  const dates: Schedule[] = []
  let after = now
  for (let index = 0; index < scheduledOccurrences; index++) {
    const next = getNextRitualReminder(ritual, after)
    if (!next) break
    if (next.timestamp > now.getTime()) dates.push({ at: new Date(next.timestamp) })
    after = new Date(Math.max(after.getTime(), next.timestamp) + 1)
  }
  return dates
}

function reminderSchedules(ritual: Ritual, now: Date): Schedule[] {
  const { schedule } = ritual
  const hasSkip = ritual.skippedThrough !== null && ritual.skippedThrough >= now.getTime()
  return ritual.reminders.flatMap((reminder): Schedule[] => {
    const [hour, minute] = reminder.time.split(':').map(Number)
    const on = { hour, minute, second: 0 }
    const singleReminder: Ritual = { ...ritual, reminders: [reminder] }
    if (schedule.kind === 'interval') return scheduledDates(singleReminder, now)
    if (schedule.kind === 'daily' && !hasSkip) return [{ on }]

    const weekdays = schedule.kind === 'weekly' ? schedule.weekdays : [1, 2, 3, 4, 5, 6, 7] as const
    return weekdays.flatMap((day): Schedule[] => {
      if (hasSkip && ritual.skippedThrough !== null) {
        const weeklyReminder: Ritual = { ...singleReminder, schedule: { kind: 'weekly', weekdays: [day] } }
        const next = getNextRitualReminder({ ...weeklyReminder, skippedThrough: null }, now)
        // Native recurring alarms cannot omit their first occurrence.
        if (next && next.timestamp <= ritual.skippedThrough) return scheduledDates(weeklyReminder, now)
      }
      return [{ on: { ...on, weekday: (day % 7 + 1) as Weekday } }]
    })
  })
}

async function reconcileNotifications(requestPermission: boolean): Promise<void> {
  const rituals = (await listRituals()).filter(({ archivedAt }) => archivedAt === null)
  const [{ notifications: pending }, { notifications: delivered }] = await Promise.all([
    LocalNotifications.getAll({ state: 'SCHEDULED' }),
    LocalNotifications.getAll({ state: 'TRIGGERED' }),
  ])
  let { display } = await LocalNotifications.checkPermissions()
  if (display !== 'granted' && requestPermission && rituals.length) {
    ({ display } = await LocalNotifications.requestPermissions())
  }

  const existing = new Map<string, number>()
  const obsolete: { id: number }[] = []
  for (const { id, extra } of pending) {
    if (typeof extra?.ritualNotification !== 'string') continue
    if (existing.has(extra.ritualNotification)) obsolete.push({ id })
    else existing.set(extra.ritualNotification, id)
  }

  const usedIds = new Set([...pending, ...delivered].map(({ id }) => id))
  let nextId = 1
  const body = translate('ritualNotificationBody')
  const now = new Date()
  const notifications: LocalNotificationSchema[] = []
  const exact = display === 'granted' && (await LocalNotifications.checkExactNotificationSetting()).exact_alarm === 'granted'

  if (display === 'granted') {
    const planned = new Set<string>()
    for (const ritual of rituals) {
      for (const schedule of reminderSchedules(ritual, now)) {
        const key = JSON.stringify([ritual.id, ritual.name, body, schedule, exact])
        if (planned.has(key)) continue
        planned.add(key)
        if (existing.delete(key)) continue
        while (usedIds.has(nextId)) nextId++
        notifications.push({
          id: nextId++,
          title: ritual.name,
          body,
          schedule: { ...schedule, allowWhileIdle: true },
          isExactNotification: exact || requestPermission,
          extra: { ritualNotification: key },
        })
      }
    }
  }

  for (const id of existing.values()) obsolete.push({ id })
  if (obsolete.length) await LocalNotifications.cancel({ notifications: obsolete })
  if (notifications.length) await LocalNotifications.schedule({ notifications })
}

export function syncRitualNotifications(requestPermission = false): void {
  if (Capacitor.getPlatform() !== 'android') return
  pendingSync = pendingSync
    .then(() => reconcileNotifications(requestPermission))
    .catch((error: unknown) => console.error('Failed to synchronize ritual notifications', error))
}
