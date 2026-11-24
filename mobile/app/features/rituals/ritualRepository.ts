import { queryDatabase, writeDatabase, writeDatabaseTransaction } from '../../storage/database'
import type { Ritual } from './ritual'
import { validateRitualInput, type RitualInput } from './ritualValidation'

type RitualRow = {
  id: string
  name: string
  schedule: string
  archived_at: string | null
  reminder_id: string | null
  reminder_time: string | null
}

async function readRituals(id?: string): Promise<Ritual[]> {
  const rows = await queryDatabase<RitualRow>(`
    SELECT rituals.id, rituals.name, rituals.schedule, rituals.archived_at,
      ritual_reminders.id AS reminder_id, ritual_reminders.time AS reminder_time
    FROM rituals
    LEFT JOIN ritual_reminders ON ritual_reminders.ritual_id = rituals.id
    ${id === undefined ? '' : 'WHERE rituals.id = ?'}
    ORDER BY rituals.name, rituals.id, ritual_reminders.position
  `, id === undefined ? [] : [id])
  const inputs = new Map<string, Omit<RitualInput, 'reminders'> & {
    archivedAt: Ritual['archivedAt']
    reminders: RitualInput['reminders'][number][]
  }>()

  for (const row of rows) {
    let input = inputs.get(row.id)
    if (!input) {
      input = { name: row.name, schedule: JSON.parse(row.schedule), archivedAt: row.archived_at, reminders: [] }
      inputs.set(row.id, input)
    }
    if (row.reminder_id !== null && row.reminder_time !== null) {
      input.reminders.push({ id: row.reminder_id, time: row.reminder_time })
    }
  }

  return Array.from(inputs, ([id, input]) => {
    const result = validateRitualInput(input)
    if (!result.valid) throw new Error('Invalid ritual data in the local database')
    return { id, archivedAt: input.archivedAt, ...result.value }
  })
}

export function listRituals(): Promise<Ritual[]> {
  return readRituals()
}

export async function getRitual(id: string): Promise<Ritual | null> {
  const [ritual] = await readRituals(id)
  return ritual ?? null
}

export function deleteRitual(id: string): Promise<void> {
  return writeDatabase('DELETE FROM rituals WHERE id = ?', [id])
}

export async function saveRitual(ritual: Ritual): Promise<void> {
  const result = validateRitualInput(ritual)
  if (!result.valid) throw new TypeError('Invalid ritual data')

  const { id, archivedAt } = ritual
  const { name, schedule, reminders } = result.value
  const reminderIds = reminders.map((reminder) => reminder.id)
  if (!id.trim() || reminderIds.some((reminderId) => !reminderId.trim())
    || new Set(reminderIds).size !== reminderIds.length) {
    throw new TypeError('Invalid ritual or reminder identifiers')
  }

  await writeDatabaseTransaction([
    {
      statement: `
        INSERT INTO rituals (id, name, schedule, archived_at) VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name, schedule = excluded.schedule, archived_at = excluded.archived_at;
      `,
      values: [id, name, JSON.stringify(schedule), archivedAt],
    },
    ...reminders.map((reminder, position) => ({
      statement: `
        INSERT INTO ritual_reminders (ritual_id, id, time, position) VALUES (?, ?, ?, ?)
        ON CONFLICT(ritual_id, id) DO UPDATE SET time = excluded.time, position = excluded.position;
      `,
      values: [id, reminder.id, reminder.time, position],
    })),
    {
      statement: `DELETE FROM ritual_reminders
        WHERE ritual_id = ? AND id NOT IN (${reminderIds.map(() => '?').join(', ')});`,
      values: [id, ...reminderIds],
    },
  ])
}
