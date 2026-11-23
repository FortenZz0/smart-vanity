import { Capacitor } from '@capacitor/core'
import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from '@capacitor-community/sqlite'
import { migrations } from './migrations'

const isDemo = import.meta.env.MODE === 'demo'
const databaseName = isDemo ? 'smart-vanity-demo' : 'smart-vanity'
const databaseVersion = migrations[migrations.length - 1].toVersion
const sqlite = new SQLiteConnection(CapacitorSQLite)
const isWeb = Capacitor.getPlatform() === 'web'

type SqlValue = string | number | null
type SqlStatement = { statement: string; values: SqlValue[] }

let connection: Promise<SQLiteDBConnection> | undefined
let pendingWrites = Promise.resolve()

async function openDatabase(): Promise<SQLiteDBConnection> {
  if (isWeb) {
    const { registerBrowserDatabase } = await import('./browserDatabase')
    await registerBrowserDatabase()
    await sqlite.initWebStore()
  }

  let upgrades = migrations
  if (isDemo) {
    const { demoProducts } = await import('./demoProducts')
    upgrades = migrations.map((migration) => migration.toVersion === 1
      ? { ...migration, statements: [...migration.statements, demoProducts] }
      : migration)
  }

  await sqlite.addUpgradeStatement(databaseName, upgrades)
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

function enqueueWrite(operation: (db: SQLiteDBConnection) => Promise<unknown>): Promise<void> {
  const write = pendingWrites.then(async () => {
    const db = await initializeDatabase()
    await operation(db)
    if (isWeb) await sqlite.saveToStore(databaseName)
  })
  pendingWrites = write.catch(() => {})
  return write
}

export function writeDatabase(sql: string, values: SqlValue[]): Promise<void> {
  return enqueueWrite((db) => db.run(sql, values))
}

export function writeDatabaseTransaction(statements: SqlStatement[]): Promise<void> {
  return enqueueWrite((db) => db.executeSet(statements, true))
}
