import { getDatabase } from "@/lib/deck-storage"
import type { BatchResult, BatchConfig, CardResult } from "@/lib/batch-operations"

const BATCH_STORE = "batches"
const STAGED_STORE = "staged"

export async function saveBatchResult(result: BatchResult): Promise<void> {
  const database = await getDatabase()
  await database.put(BATCH_STORE, result)
}

export async function loadBatchResult(deckId: string): Promise<BatchResult | undefined> {
  const database = await getDatabase()
  return database.get(BATCH_STORE, deckId)
}

export async function deleteBatchResult(deckId: string): Promise<void> {
  const database = await getDatabase()
  await database.delete(BATCH_STORE, deckId)
}

export type StagedChanges = {
  deckId: string
  cardResults: CardResult[]
  config: BatchConfig
  createdAt: string
}

export async function saveStagedChanges(changes: StagedChanges): Promise<void> {
  const database = await getDatabase()
  await database.put(STAGED_STORE, changes)
}

export async function loadStagedChanges(deckId: string): Promise<StagedChanges | undefined> {
  const database = await getDatabase()
  return database.get(STAGED_STORE, deckId)
}

export async function deleteStagedChanges(deckId: string): Promise<void> {
  const database = await getDatabase()
  await database.delete(STAGED_STORE, deckId)
}

export async function hasStagedChanges(deckId: string): Promise<boolean> {
  const changes = await loadStagedChanges(deckId)
  return changes !== undefined
}
