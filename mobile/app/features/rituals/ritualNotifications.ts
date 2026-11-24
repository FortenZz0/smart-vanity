import { Capacitor } from '@capacitor/core'
import { LocalNotifications, type LocalNotificationSchema, type Schedule, type Weekday } from '@capacitor/local-notifications'
import { translate } from '../../locales'
import { getNextRitualReminder } from './nextRitualReminder'
import type { Ritual } from './ritual'
import { listRituals } from './ritualRepository'

const intervalOccurrences = 12
let pendingSync = Promise.resolve()

function reminderSchedules(ritual: Ritual, now: Date): Schedule[] {
  const { schedule } = ritual
  return ritual.reminders.flatMap((reminder): Schedule[] => {
    const [hour, minute] = reminder.time.split(':').map(Number)
    const on = { hour, minute, second: 0 }
    switch (schedule.kind) {
      case 'daily':
        return [{ on }]
      case 'weekly':
        return schedule.weekdays.map((day) => ({
          on: { ...on, weekday: (day % 7 + 1) as Weekday },
        }))
      case 'interval': {
        const dates: Schedule[] = []
        let after = now
        for (let index = 0; index < intervalOccurrences; index++) {
          const next = getNextRitualReminder({ ...ritual, reminders: [reminder] }, after)
          if (!next) break
          const at = new Date(after)
          at.setFullYear(next.date.getUTCFullYear(), next.date.getUTCMonth(), next.date.getUTCDate())
          at.setHours(hour, minute, 0, 0)
          if (at > now) dates.push({ at })
          after = new Date(Math.max(after.getTime(), at.getTime()) + 1)
        }
        return dates
      }
    }
  })
}

async function reconcileNotifications(requestPermission: boolean): Promise<void> {
  const rituals = (await listRituals()).filter(({ archivedAt }) => archivedAt === null)
  const { notifications: pending } = await LocalNotifications.getPending()
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

  const usedIds = new Set(pending.map(({ id }) => id))
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
