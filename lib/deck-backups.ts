import { openDB } from "idb"

type DeckBackupRecord = {
  id: string
  fileName: string
  fileSize: number
  createdAt: string
  data: ArrayBuffer
}

const DATABASE_NAME = "totoneru"
const DATABASE_VERSION = 1
const BACKUP_STORE = "backups"

async function getDatabase() {
  return openDB(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(BACKUP_STORE)) {
        database.createObjectStore(BACKUP_STORE, { keyPath: "id" })
      }
    },
  })
}

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
