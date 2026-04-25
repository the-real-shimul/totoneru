import { getDatabase } from "@/lib/deck-storage"

export type ManualWordTarget = "standalone" | "deck"
export type ManualWordTemplate = "basic" | "japanese-vocab"

export type ManualWord = {
  id: string
  expression: string
  createdAt: string
  updatedAt: string
  targets: ManualWordTarget[]
  template: ManualWordTemplate
  generatedFields: {
    reading?: string
    meaning?: string
    sentence?: string
    translation?: string
    notes?: string
  }
}

const STORE = "manualWords"

export function createManualWord(expression: string): ManualWord {
  const now = new Date().toISOString()

  return {
    id: crypto.randomUUID(),
    expression: expression.trim(),
    createdAt: now,
    updatedAt: now,
    targets: ["standalone"],
    template: "basic",
    generatedFields: {},
  }
}

export async function listManualWords(): Promise<ManualWord[]> {
  const database = await getDatabase()
  const words = (await database.getAll(STORE)) as ManualWord[]

  return words.sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  )
}

export async function saveManualWord(word: ManualWord): Promise<void> {
  const database = await getDatabase()
  await database.put(STORE, {
    ...word,
    expression: word.expression.trim(),
    updatedAt: new Date().toISOString(),
  })
}

export async function addManualWord(expression: string): Promise<ManualWord> {
  const word = createManualWord(expression)
  await saveManualWord(word)
  return word
}

export async function deleteManualWord(id: string): Promise<void> {
  const database = await getDatabase()
  await database.delete(STORE, id)
}

export function hasTarget(word: ManualWord, target: ManualWordTarget) {
  return word.targets.includes(target)
}

export function setManualWordTarget(
  word: ManualWord,
  target: ManualWordTarget,
  enabled: boolean
): ManualWord {
  const targets = new Set(word.targets)

  if (enabled) {
    targets.add(target)
  } else {
    targets.delete(target)
  }

  return {
    ...word,
    targets: Array.from(targets),
  }
}

