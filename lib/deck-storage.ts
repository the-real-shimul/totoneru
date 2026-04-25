import { openDB } from "idb"

import type { ActiveDeck } from "@/lib/deck-model"

type DeckBackupRecord = {
  id: string
  fileName: string
  fileSize: number
  createdAt: string
  data: ArrayBuffer
}

const DATABASE_NAME = "totoneru"
const DATABASE_VERSION = 5
const BACKUP_STORE = "backups"
const DECK_STORE = "decks"
const KEY_STORE = "keys"
const BATCH_STORE = "batches"
const STAGED_STORE = "staged"
const MANUAL_WORD_STORE = "manualWords"

export async function getDatabase() {
  return openDB(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(database, oldVersion) {
      if (!database.objectStoreNames.contains(BACKUP_STORE)) {
        database.createObjectStore(BACKUP_STORE, { keyPath: "id" })
      }
      if (oldVersion < 2 && !database.objectStoreNames.contains(DECK_STORE)) {
        database.createObjectStore(DECK_STORE, { keyPath: "id" })
      }
      if (oldVersion < 3 && !database.objectStoreNames.contains(KEY_STORE)) {
        database.createObjectStore(KEY_STORE, { keyPath: "id" })
      }
      if (oldVersion < 4) {
        if (!database.objectStoreNames.contains(BATCH_STORE)) {
          database.createObjectStore(BATCH_STORE, { keyPath: "deckId" })
        }
        if (!database.objectStoreNames.contains(STAGED_STORE)) {
          database.createObjectStore(STAGED_STORE, { keyPath: "deckId" })
        }
      }
      if (!database.objectStoreNames.contains(MANUAL_WORD_STORE)) {
        database.createObjectStore(MANUAL_WORD_STORE, { keyPath: "id" })
      }
    },
  })
}

/* ---------- backups ---------- */

export async function saveOriginalDeckBackup(file: File, data: ArrayBuffer) {
  const database = await getDatabase()
  const backup: DeckBackupRecord = {
    id: crypto.randomUUID(),
    fileName: file.name,
    fileSize: file.size,
    createdAt: new Date().toISOString(),
    data,
  }

  await database.put(BACKUP_STORE, backup)

  return {
    id: backup.id,
    fileName: backup.fileName,
    fileSize: backup.fileSize,
    createdAt: backup.createdAt,
  }
}

export async function loadBackupData(backupId: string): Promise<ArrayBuffer | undefined> {
  const database = await getDatabase()
  const record = await database.get(BACKUP_STORE, backupId)
  return record?.data
}

export async function deleteBackup(backupId: string): Promise<void> {
  const database = await getDatabase()
  await database.delete(BACKUP_STORE, backupId)
}

export async function deleteAllStaleDeckRecords(keepId: string): Promise<void> {
  const database = await getDatabase()
  const allDecks = await database.getAll(DECK_STORE)
  for (const deck of allDecks) {
    if (deck.id !== keepId) {
      await database.delete(DECK_STORE, deck.id)
    }
  }
}

export async function saveActiveDeck(deck: ActiveDeck): Promise<void> {
  const database = await getDatabase()
  await database.put(DECK_STORE, deck)
}

export async function loadMostRecentActiveDeck(): Promise<ActiveDeck | undefined> {
  const database = await getDatabase()
  const allDecks = await database.getAll(DECK_STORE)
  if (allDecks.length === 0) return undefined

  return allDecks.sort(
    (a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime()
  )[0]
}

export async function deleteActiveDeck(deckId: string): Promise<void> {
  const database = await getDatabase()
  await database.delete(DECK_STORE, deckId)
}
