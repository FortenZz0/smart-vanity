import type { capSQLiteVersionUpgrade } from '@capacitor-community/sqlite'

export const migrations: capSQLiteVersionUpgrade[] = [
  {
    toVersion: 1,
    statements: [
      `CREATE TABLE products (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL CHECK (length(trim(name)) > 0),
        note TEXT NOT NULL,
        photo_id TEXT,
        opened_on TEXT,
        pao_months INTEGER CHECK (pao_months IS NULL OR (typeof(pao_months) = 'integer' AND pao_months > 0)),
        expiry_kind TEXT,
        expires_on TEXT,
        manufactured_on TEXT,
        shelf_duration INTEGER,
        shelf_unit TEXT,
        archived_at TEXT,
        CHECK (
          (expiry_kind IS NULL AND expires_on IS NULL AND manufactured_on IS NULL AND shelf_duration IS NULL AND shelf_unit IS NULL)
          OR (expiry_kind IS 'date' AND expires_on IS NOT NULL AND manufactured_on IS NULL AND shelf_duration IS NULL AND shelf_unit IS NULL)
          OR (expiry_kind IS 'shelfLife' AND expires_on IS NULL AND manufactured_on IS NOT NULL
              AND typeof(shelf_duration) = 'integer' AND shelf_duration > 0
              AND shelf_unit IS NOT NULL AND shelf_unit IN ('days', 'months', 'years'))
        )
      );`,
      `CREATE TABLE product_photos (
        id TEXT PRIMARY KEY NOT NULL,
        mime_type TEXT NOT NULL
      );`,
    ],
  },
  {
    toVersion: 2,
    statements: [
      `CREATE TABLE rituals (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL CHECK (length(trim(name)) > 0),
        schedule TEXT NOT NULL
      );`,
      `CREATE TABLE ritual_reminders (
        ritual_id TEXT NOT NULL REFERENCES rituals(id) ON DELETE CASCADE,
        id TEXT NOT NULL,
        time TEXT NOT NULL CHECK (
          (time GLOB '[01][0-9]:[0-5][0-9]' OR time GLOB '2[0-3]:[0-5][0-9]')
        ),
        position INTEGER NOT NULL CHECK (position >= 0),
        PRIMARY KEY (ritual_id, id)
      );`,
    ],
  },
  {
    // Version 3 was used to seed the demo database.
    toVersion: 4,
    statements: ['ALTER TABLE rituals ADD COLUMN archived_at TEXT;'],
  },
  {
    toVersion: 5,
    statements: ['ALTER TABLE rituals ADD COLUMN skipped_through INTEGER;'],
  },
  {
    toVersion: 6,
    statements: [
      'ALTER TABLE rituals ADD COLUMN paused INTEGER NOT NULL DEFAULT 0 CHECK (paused IN (0, 1));',
      `CREATE TABLE ritual_skips (
        ritual_id TEXT NOT NULL REFERENCES rituals(id) ON DELETE CASCADE,
        timestamp INTEGER NOT NULL,
        PRIMARY KEY (ritual_id, timestamp)
      );`,
      `INSERT INTO ritual_skips (ritual_id, timestamp)
      SELECT id, skipped_through FROM rituals WHERE skipped_through IS NOT NULL;`,
    ],
  },
  {
    toVersion: 7,
    statements: ['ALTER TABLE products ADD COLUMN icon_id TEXT;'],
  },
  {
    toVersion: 8,
    statements: ['ALTER TABLE products ADD COLUMN finished INTEGER NOT NULL DEFAULT 0 CHECK (finished IN (0, 1));'],
  },
  {
    toVersion: 9,
    statements: [
      'ALTER TABLE products ADD COLUMN created_at TEXT;',
      'ALTER TABLE products ADD COLUMN updated_at TEXT;',
    ],
  },
]
