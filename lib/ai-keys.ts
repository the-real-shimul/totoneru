import { getDatabase } from "@/lib/deck-storage"
import type { AiProvider } from "@/lib/ai-types"

const KEY_STORE = "keys"

export type StoredKey = {
  id: string
  provider: AiProvider
  endpoint: string
  apiKey: string
  model: string
  label: string
  createdAt: string
}

export async function saveApiKey(config: {
  provider: AiProvider
  endpoint: string
  apiKey: string
  model: string
  label: string
}): Promise<StoredKey> {
  const database = await getDatabase()
  const record: StoredKey = {
    id: crypto.randomUUID(),
    ...config,
    createdAt: new Date().toISOString(),
  }
  await database.put(KEY_STORE, record)
  return record
}

export async function loadApiKeys(): Promise<StoredKey[]> {
  const database = await getDatabase()
  return database.getAll(KEY_STORE)
}

export async function loadApiKey(keyId: string): Promise<StoredKey | undefined> {
  const database = await getDatabase()
  return database.get(KEY_STORE, keyId)
}

export async function deleteApiKey(keyId: string): Promise<void> {
  const database = await getDatabase()
  await database.delete(KEY_STORE, keyId)
}

export async function getActiveApiKey(): Promise<StoredKey | undefined> {
  const keys = await loadApiKeys()
  return keys[0]
}
