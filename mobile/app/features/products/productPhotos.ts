import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { queryDatabase, writeDatabase } from '../../storage/database'

function photoFile(id: string) {
  return { path: `product-photos/${id}`, directory: Directory.Data }
}

export function readBase64(photo: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      resolve(dataUrl.slice(dataUrl.indexOf(',') + 1))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(photo)
  })
}

export async function saveProductPhoto(photo: Blob): Promise<string> {
  if (!photo.type.startsWith('image/') || photo.size === 0) {
    throw new TypeError('Expected a non-empty image')
  }

  const id = crypto.randomUUID()
  const file = photoFile(id)
  const data = Capacitor.isNativePlatform() ? await readBase64(photo) : photo
  await Filesystem.writeFile({ ...file, data, recursive: true })

  try {
    await writeDatabase('INSERT INTO product_photos (id, mime_type) VALUES (?, ?);', [id, photo.type])
  } catch (error) {
    await Filesystem.deleteFile(file).catch(() => {})
    throw error
  }
  return id
}

export async function discardUnattachedProductPhoto(id: string): Promise<void> {
  const [product] = await queryDatabase<{ id: string }>(
    'SELECT id FROM products WHERE photo_id = ? LIMIT 1', [id],
  )
  if (product) return

  await writeDatabase('DELETE FROM product_photos WHERE id = ?', [id])
  await Filesystem.deleteFile(photoFile(id))
}

export async function getProductPhoto(id: string): Promise<Blob | null> {
  const [row] = await queryDatabase<{ mime_type: string }>(
    'SELECT mime_type FROM product_photos WHERE id = ?', [id],
  )
  if (!row) return null

  const { data } = await Filesystem.readFile(photoFile(id))
  const bytes = typeof data === 'string' ? Uint8Array.from(atob(data), (byte) => byte.charCodeAt(0)) : data
  return new Blob([bytes], { type: row.mime_type })
}
