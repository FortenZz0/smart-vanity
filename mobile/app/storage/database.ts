import { Capacitor } from '@capacitor/core'
import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from '@capacitor-community/sqlite'
import { migrations } from './migrations'

const databaseName = 'smart-vanity'
const databaseVersion = migrations[migrations.length - 1].toVersion
const sqlite = new SQLiteConnection(CapacitorSQLite)
const isWeb = Capacitor.getPlatform() === 'web'

type SqlValue = string | number | null

let connection: Promise<SQLiteDBConnection> | undefined
let pendingWrites = Promise.resolve()

async function openDatabase(): Promise<SQLiteDBConnection> {
  if (isWeb) {
    const { registerBrowserDatabase } = await import('./browserDatabase')
    await registerBrowserDatabase()
    await sqlite.initWebStore()
  }

  await sqlite.addUpgradeStatement(databaseName, migrations)
  const db = await sqlite.createConnection(databaseName, false, 'no-encryption', databaseVersion, false)
  try {
    await db.open()
    if ((await db.getVersion()).version !== databaseVersion) {
      throw new Error('Unexpected local database version')
    }
    if (isWeb) await sqlite.saveToStore(databaseName)
    return db
  } catch (error) {
    await sqlite.closeConnection(databaseName, false).catch(() => {})
    throw error
  }
}

export function initializeDatabase(): Promise<SQLiteDBConnection> {
  connection ??= openDatabase().catch((error: unknown) => {
    connection = undefined
    throw error
  })
  return connection
}

export async function queryDatabase<Row>(sql: string, values: SqlValue[] = []): Promise<Row[]> {
  await pendingWrites
  const db = await initializeDatabase()
  const result = await db.query(sql, values)
  return (result.values ?? []) as Row[]
}

export function writeDatabase(sql: string, values: SqlValue[]): Promise<void> {
  const write = pendingWrites.then(async () => {
    const db = await initializeDatabase()
    await db.run(sql, values)
    if (isWeb) await sqlite.saveToStore(databaseName)
  })
  pendingWrites = write.catch(() => {})
  return write
}
