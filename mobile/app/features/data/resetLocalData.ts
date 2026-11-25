import { queryDatabase, writeDatabaseTransaction } from '../../storage/database'
import { discardUnattachedProductPhoto } from '../products/productPhotos'
import { syncRitualNotifications } from '../rituals/ritualNotifications'

export async function resetLocalData(
  options: { products: boolean; rituals: boolean },
  seedStatements: readonly string[] = [],
): Promise<void> {
  if (!options.products && !options.rituals) return

  const photos = options.products ? await queryDatabase<{ photo_id: string }>(
    'SELECT DISTINCT photo_id FROM products WHERE photo_id IS NOT NULL',
  ) : []
  const statements: string[] = []
  if (options.products) statements.push('DELETE FROM products;')
  if (options.rituals) {
    statements.push('DELETE FROM ritual_reminders;', 'DELETE FROM ritual_skips;', 'DELETE FROM rituals;')
  }
  statements.push(...seedStatements)
  await writeDatabaseTransaction(statements.map((statement) => ({ statement, values: [] })))
  if (options.rituals) syncRitualNotifications()

  for (const { photo_id } of photos) {
    await discardUnattachedProductPhoto(photo_id).catch((error: unknown) => {
      console.error('Failed to clean up a photo after reset', error)
    })
  }
}
