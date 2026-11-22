import { queryDatabase, writeDatabase } from '../../storage/database'
import type { CalendarDate, ExpiryInput, Product, ShelfLifeUnit } from './product'

type ProductRow = {
  id: string
  name: string
  note: string
  photo_id: string | null
  opened_on: CalendarDate | null
  pao_months: number | null
  archived_at: string | null
} & (
  | { expiry_kind: null }
  | { expiry_kind: 'date'; expires_on: CalendarDate }
  | { expiry_kind: 'shelfLife'; manufactured_on: CalendarDate; shelf_duration: number; shelf_unit: ShelfLifeUnit }
)

function toProduct(row: ProductRow): Product {
  let expiry: ExpiryInput | null = null
  if (row.expiry_kind === 'date') {
    expiry = { kind: 'date', expiresOn: row.expires_on }
  } else if (row.expiry_kind === 'shelfLife') {
    expiry = {
      kind: 'shelfLife',
      manufacturedOn: row.manufactured_on,
      duration: row.shelf_duration,
      unit: row.shelf_unit,
    }
  }

  return {
    id: row.id,
    name: row.name,
    note: row.note,
    photoId: row.photo_id,
    openedOn: row.opened_on,
    paoMonths: row.pao_months,
    expiry,
    archivedAt: row.archived_at,
  }
}

export async function listProducts(): Promise<Product[]> {
  const rows = await queryDatabase<ProductRow>('SELECT * FROM products')
  return rows.map(toProduct)
}

export async function getProduct(id: string): Promise<Product | null> {
  const [row] = await queryDatabase<ProductRow>('SELECT * FROM products WHERE id = ?', [id])
  return row ? toProduct(row) : null
}

export function saveProduct(product: Product): Promise<void> {
  const { expiry } = product
  const shelfLife = expiry?.kind === 'shelfLife' ? expiry : null

  return writeDatabase(`
    INSERT INTO products (
      id, name, note, photo_id, opened_on, pao_months, expiry_kind, expires_on,
      manufactured_on, shelf_duration, shelf_unit, archived_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      note = excluded.note,
      photo_id = excluded.photo_id,
      opened_on = excluded.opened_on,
      pao_months = excluded.pao_months,
      expiry_kind = excluded.expiry_kind,
      expires_on = excluded.expires_on,
      manufactured_on = excluded.manufactured_on,
      shelf_duration = excluded.shelf_duration,
      shelf_unit = excluded.shelf_unit,
      archived_at = excluded.archived_at;
  `, [
    product.id, product.name, product.note, product.photoId, product.openedOn, product.paoMonths,
    expiry?.kind ?? null, expiry?.kind === 'date' ? expiry.expiresOn : null,
    shelfLife?.manufacturedOn ?? null, shelfLife?.duration ?? null, shelfLife?.unit ?? null,
    product.archivedAt,
  ])
}
