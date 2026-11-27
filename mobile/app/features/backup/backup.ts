import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { queryDatabase, writeDatabaseTransaction } from '../../storage/database'
import { parseCalendarDate } from '../products/expiry'
import type { ExpiryInput, Product } from '../products/product'
import { discardUnattachedProductPhoto, getProductPhoto, readBase64, saveProductPhoto } from '../products/productPhotos'
import { insertProductStatement, listProducts } from '../products/productRepository'
import type { Ritual } from '../rituals/ritual'
import { listRituals } from '../rituals/ritualRepository'
import { syncRitualNotifications } from '../rituals/ritualNotifications'
import { validateRitualInput, type RitualInput } from '../rituals/ritualValidation'
import { ref } from 'vue'

const nativeBackup = registerPlugin<{
  save(options: { filename: string; json: string }): Promise<void>
  getLaunchBackup(): Promise<{ uri?: string }>
  addListener(event: 'backupOpen', listener: (backup: { uri: string }) => void): Promise<PluginListenerHandle>
}>('SmartVanityBackup')
export const incomingBackupUri = ref<string | null>(null)

export async function listenForIncomingBackups(openBackup: () => Promise<unknown>): Promise<void> {
  function receive({ uri }: { uri?: string }) {
    if (!uri) return
    incomingBackupUri.value = uri
    void openBackup().catch((error: unknown) => console.error('Failed to open backup settings', error))
  }

  const launch = await nativeBackup.getLaunchBackup()
  receive(launch)
  await nativeBackup.addListener('backupOpen', receive)
}

export async function readIncomingBackup(uri: string): Promise<string> {
  const { data } = await Filesystem.readFile({ path: uri, encoding: Encoding.UTF8 })
  return typeof data === 'string' ? data : data.text()
}

type BackupPhoto = { mimeType: string; base64: string }
type BackupProduct = Omit<Product, 'photoId'> & { photo: BackupPhoto | null }
type BackupRitual = Omit<Ritual, 'skippedThrough'> & { skips: number[] }
type BackupOptions = { includeProducts: boolean; includePhotos: boolean; includeRituals: boolean }

const format = 'smart-vanity-products'
const version = 1

export class InvalidBackupError extends Error {}

function invalidBackup(): never {
  throw new InvalidBackupError('Invalid Smart Vanity backup')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readDate(value: unknown) {
  const date = typeof value === 'string' && parseCalendarDate(value)
  return date || invalidBackup()
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

function readExpiry(value: unknown): ExpiryInput | null {
  if (value === null) return null
  if (!isRecord(value)) return invalidBackup()
  if (value.kind === 'date') return { kind: 'date', expiresOn: readDate(value.expiresOn) }
  const { duration, unit } = value
  if (value.kind === 'shelfLife' && isPositiveInteger(duration) &&
      (unit === 'days' || unit === 'months' || unit === 'years')) {
    return { kind: 'shelfLife', manufacturedOn: readDate(value.manufacturedOn), duration, unit }
  }
  return invalidBackup()
}

function readPhoto(value: unknown): BackupPhoto | null {
  if (value === null) return null
  if (!isRecord(value)) return invalidBackup()
  const { mimeType, base64 } = value
  if (typeof mimeType !== 'string' || !/^image\/[a-z0-9.+-]+$/i.test(mimeType) ||
      typeof base64 !== 'string' || base64.length === 0 || base64.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) return invalidBackup()
  return { mimeType, base64 }
}

function readProduct(value: unknown): BackupProduct {
  if (!isRecord(value)) return invalidBackup()
  const { id, name, note, iconId, openedOn, paoMonths, expiry, archivedAt, photo, finished = false } = value
  const { createdAt = null, updatedAt = null } = value
  if (typeof id !== 'string' || !id.trim() || typeof name !== 'string' || !name.trim() ||
      typeof note !== 'string' || (iconId !== null && typeof iconId !== 'string') ||
      (paoMonths !== null && !isPositiveInteger(paoMonths)) || typeof finished !== 'boolean' ||
      !isOptionalTimestamp(archivedAt) || !isOptionalTimestamp(createdAt) || !isOptionalTimestamp(updatedAt)) {
    return invalidBackup()
  }
  return {
    id, name, note, iconId, paoMonths, archivedAt, finished, createdAt, updatedAt,
    openedOn: openedOn === null ? null : readDate(openedOn),
    expiry: readExpiry(expiry),
    photo: readPhoto(photo),
  }
}

function isOptionalTimestamp(value: unknown): value is string | null {
  return value === null || (typeof value === 'string' && Number.isFinite(Date.parse(value)))
}

function readRitualSchedule(value: unknown): RitualInput['schedule'] {
  if (!isRecord(value)) return invalidBackup()
  if (value.kind === 'daily') return { kind: 'daily' }
  if (value.kind === 'interval' && isPositiveInteger(value.everyDays) && typeof value.startsOn === 'string') {
    return { kind: 'interval', everyDays: value.everyDays, startsOn: value.startsOn }
  }
  if (value.kind === 'weekly' && Array.isArray(value.weekdays) &&
      value.weekdays.every((day: unknown) => typeof day === 'number')) {
    return { kind: 'weekly', weekdays: value.weekdays }
  }
  return invalidBackup()
}

function readRitual(value: unknown): BackupRitual {
  if (!isRecord(value)) return invalidBackup()
  const { id, name, archivedAt, paused, schedule, reminders, skips } = value
  if (typeof id !== 'string' || !id.trim() || typeof name !== 'string' ||
      (archivedAt !== null && (typeof archivedAt !== 'string' || !Number.isFinite(Date.parse(archivedAt)))) ||
      typeof paused !== 'boolean' || !Array.isArray(reminders) || !Array.isArray(skips) ||
      !skips.every(isPositiveInteger)) return invalidBackup()
  const inputReminders = reminders.map((reminder: unknown) => {
    if (!isRecord(reminder) || typeof reminder.id !== 'string' || !reminder.id.trim() ||
        typeof reminder.time !== 'string') return invalidBackup()
    return { id: reminder.id, time: reminder.time }
  })
  if (new Set(inputReminders.map(({ id }) => id)).size !== inputReminders.length) return invalidBackup()
  const result = validateRitualInput({ name, schedule: readRitualSchedule(schedule), reminders: inputReminders })
  if (!result.valid) return invalidBackup()
  return { id, archivedAt, paused, skips: [...new Set(skips)], ...result.value }
}

function parseBackup(json: string, options: BackupOptions) {
  let value: unknown
  try {
    value = JSON.parse(json)
  } catch {
    return invalidBackup()
  }
  if (!isRecord(value) || value.format !== format || value.version !== version || !Array.isArray(value.products)) {
    return invalidBackup()
  }
  const products = options.includeProducts ? value.products.map(readProduct) : []
  if (new Set(products.map(({ id }) => id)).size !== products.length) return invalidBackup()
  let rituals: BackupRitual[] = []
  if (options.includeRituals && value.rituals !== undefined) {
    if (!Array.isArray(value.rituals)) return invalidBackup()
    rituals = value.rituals.map(readRitual)
    if (new Set(rituals.map(({ id }) => id)).size !== rituals.length) return invalidBackup()
  }
  return { products, rituals }
}

function insertRitualStatements(ritual: BackupRitual) {
  const { id, name, schedule, archivedAt, paused, reminders, skips } = ritual
  return [
    {
      statement: 'INSERT INTO rituals (id, name, schedule, archived_at, paused) VALUES (?, ?, ?, ?, ?);',
      values: [id, name, JSON.stringify(schedule), archivedAt, Number(paused)],
    },
    ...reminders.map((reminder, position) => ({
      statement: 'INSERT INTO ritual_reminders (ritual_id, id, time, position) VALUES (?, ?, ?, ?);',
      values: [id, reminder.id, reminder.time, position],
    })),
    ...skips.map((timestamp) => ({
      statement: 'INSERT INTO ritual_skips (ritual_id, timestamp) VALUES (?, ?);',
      values: [id, timestamp],
    })),
  ]
}

export async function importBackup(json: string, options: BackupOptions): Promise<void> {
  const { products, rituals } = parseBackup(json, options)
  const [currentProducts, currentRituals] = await Promise.all([
    products.length ? queryDatabase<{ id: string }>('SELECT id FROM products') : [],
    rituals.length ? queryDatabase<{ id: string }>('SELECT id FROM rituals') : [],
  ])
  const existing = new Set(currentProducts.map(({ id }) => id))
  const existingRituals = new Set(currentRituals.map(({ id }) => id))
  const pendingRituals = rituals.filter(({ id }) => !existingRituals.has(id))
  const pending: Product[] = []
  const addedPhotos: string[] = []
  try {
    for (const { photo, ...product } of products) {
      if (existing.has(product.id)) continue
      let photoId: string | null = null
      if (options.includePhotos && photo) {
        const bytes = Uint8Array.from(atob(photo.base64), (byte) => byte.charCodeAt(0))
        photoId = await saveProductPhoto(new Blob([bytes], { type: photo.mimeType }))
        addedPhotos.push(photoId)
      }
      pending.push({ ...product, photoId })
    }
    const statements = [...pending.map(insertProductStatement), ...pendingRituals.flatMap(insertRitualStatements)]
    if (statements.length) await writeDatabaseTransaction(statements)
  } catch (error) {
    // A failed transaction leaves staged photos without a product.
    for (const id of addedPhotos) {
      await discardUnattachedProductPhoto(id).catch((error: unknown) => {
        console.error('Failed to clean up an imported product photo', error)
      })
    }
    throw error
  }
  if (pendingRituals.length) syncRitualNotifications()
}

async function exportRituals(): Promise<BackupRitual[]> {
  const [rituals, rows] = await Promise.all([
    listRituals(),
    queryDatabase<{ ritual_id: string; timestamp: number }>('SELECT ritual_id, timestamp FROM ritual_skips ORDER BY timestamp'),
  ])
  const skips = new Map<string, number[]>()
  for (const { ritual_id, timestamp } of rows) {
    const timestamps = skips.get(ritual_id)
    if (timestamps) timestamps.push(timestamp)
    else skips.set(ritual_id, [timestamp])
  }
  return rituals.map(({ skippedThrough: _, ...ritual }) => ({
    ...ritual,
    skips: skips.get(ritual.id) ?? [],
  }))
}

export async function exportBackup(options: BackupOptions, destination: 'download' | 'share'): Promise<void> {
  const products: BackupProduct[] = []
  const sourceProducts = options.includeProducts ? await listProducts() : []
  for (const { photoId, ...product } of sourceProducts) {
    let photo: BackupPhoto | null = null
    if (options.includePhotos && photoId) {
      const blob = await getProductPhoto(photoId)
      if (!blob) throw new Error('Product photo is missing')
      photo = { mimeType: blob.type, base64: await readBase64(blob) }
    }
    products.push({ ...product, photo })
  }
  const rituals = options.includeRituals ? await exportRituals() : []
  const json = JSON.stringify({ format, version, products, rituals }, null, 2)
  const filename = `smart-vanity-${new Date().toISOString().slice(0, 10)}.sv`

  if (Capacitor.getPlatform() === 'android' && destination === 'download') {
    await nativeBackup.save({ filename, json })
    return
  }

  if (Capacitor.isNativePlatform() && destination === 'share') {
    const { uri } = await Filesystem.writeFile({
      directory: Directory.Cache,
      path: `backups/${crypto.randomUUID()}/${filename}`,
      data: json,
      encoding: Encoding.UTF8,
      recursive: true,
    })
    try {
      await Share.share({ files: [uri] })
    } catch (error) {
      if (!(error instanceof Error) || error.message !== 'Share canceled') throw error
    }
    return
  }

  const url = URL.createObjectURL(new Blob([json], { type: 'application/vnd.smartvanity.backup' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
