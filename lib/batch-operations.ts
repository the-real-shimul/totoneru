import type { FieldRole } from "@/lib/schema-mapping"
import type { ParsedNote, ParsedNoteType } from "@/lib/apkg-parser-types"
import { applyTemplateTransform } from "@/lib/templates"
import type { TemplateType } from "@/lib/templates"
import { applyTransformations } from "@/lib/transformations"
import type { TransformationConfig } from "@/lib/transformations"
import { sendAiRequest } from "@/lib/ai-client"
import { getActiveApiKey } from "@/lib/ai-keys"
import type { AiMessage } from "@/lib/ai-types"
import { interpolatePrompt, sanitizeAiOutput } from "@/lib/prompts"
import type { UserPrompt } from "@/lib/prompts"

export type BatchConfig = {
  deckId: string
  transformationConfigs: TransformationConfig[]
  prompt: UserPrompt | null
  fieldMappingsByNoteType: Record<string, Record<string, FieldRole>>
  templateSelectionsByNoteType: Record<string, TemplateType>
}

export type CardResult = {
  noteId: string
  status: "success" | "error"
  originalFields: string[]
  transformedFields: string[]
  fieldOrder: string[]
  changed: boolean
  error?: string
}

export type BatchResult = {
  deckId: string
  totalCards: number
  processedCount: number
  successCount: number
  failedCount: number
  cardResults: CardResult[]
  completedAt: string | null
}

export type BatchProgress = {
  current: number
  total: number
  currentNoteId: string
}

const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message
    return (
      msg.includes("429") ||
      msg.includes("500") ||
      msg.includes("502") ||
      msg.includes("503") ||
      msg.includes("504") ||
      msg.includes("rate limit") ||
      msg.includes("Rate limit")
    )
  }
  return false
}

async function withRetry<T>(fn: () => Promise<T>, attempt = 1): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (attempt >= MAX_RETRIES || !isRetryableError(error)) {
      throw error
    }
    const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 500
    await sleep(delay)
    return withRetry(fn, attempt + 1)
  }
}

async function applyAiPromptToNote({
  note,
  noteType,
  fieldMappings,
  prompt,
}: {
  note: ParsedNote
  noteType: ParsedNoteType
  fieldMappings: Record<string, FieldRole>
  prompt: UserPrompt
}): Promise<Record<number, string>> {
  const key = await getActiveApiKey()
  if (!key) {
    throw new Error("No API key configured")
  }

  const roleToFieldName: Record<string, string> = {}
  for (const [fieldName, role] of Object.entries(fieldMappings)) {
    roleToFieldName[role] = fieldName
  }

  const variableValues: Record<string, string> = {}
  for (const variable of prompt.variables) {
    const fieldName = roleToFieldName[variable.role]
    if (fieldName) {
      const index = noteType.fieldNames.indexOf(fieldName)
      if (index >= 0) {
        variableValues[variable.name] = note.fieldValues[index] ?? ""
      }
    }
  }

  const systemContent = interpolatePrompt(prompt.systemMessage, variableValues)
  const userContent = interpolatePrompt(prompt.userMessage, variableValues)

  const messages: AiMessage[] = []
  if (systemContent) {
    messages.push({ role: "system", content: systemContent })
  }
  messages.push({ role: "user", content: userContent })

  const response = await withRetry(() =>
    sendAiRequest({
      provider: key.provider,
      messages,
      config: {
        endpoint: key.endpoint,
        apiKey: key.apiKey,
        model: key.model,
      },
    })
  )

  const sanitized = sanitizeAiOutput(response)

  const outputFieldIndex = noteType.fieldNames.findIndex(
    (name) => fieldMappings[name] === "meaning"
  )

  if (outputFieldIndex >= 0) {
    return { [outputFieldIndex]: sanitized }
  }

  return {}
}

export async function processCard({
  note,
  noteType,
  fieldMappings,
  templateType,
  transformationConfigs,
  prompt,
}: {
  note: ParsedNote
  noteType: ParsedNoteType
  fieldMappings: Record<string, FieldRole>
  templateType: TemplateType
  transformationConfigs: TransformationConfig[]
  prompt: UserPrompt | null
}): Promise<CardResult> {
  try {
    const templateTransform = applyTemplateTransform({
      note,
      noteType,
      fieldMappings,
      templateType,
    })

    const transformedFields = [...templateTransform.note.fieldValues]

    for (let i = 0; i < noteType.fieldNames.length; i++) {
      const fieldName = noteType.fieldNames[i]
      const role = fieldMappings[fieldName] ?? "unknown"
      const originalValue = note.fieldValues[i] ?? ""
      const transformedIndex = templateTransform.fieldOrder.indexOf(fieldName)
      if (transformedIndex >= 0) {
        const result = await applyTransformations({
          value: originalValue,
          role,
          configs: transformationConfigs,
        })
        transformedFields[transformedIndex] = result.value
      }
    }

    if (prompt) {
      const aiChanges = await applyAiPromptToNote({
        note,
        noteType,
        fieldMappings,
        prompt,
      })
      for (const [index, value] of Object.entries(aiChanges)) {
        const idx = Number(index)
        const fieldName = templateTransform.fieldOrder[idx]
        if (fieldName) {
          transformedFields[idx] = value
        }
      }
    }

    const changed = transformedFields.some((v, i) => v !== note.fieldValues[i])

    return {
      noteId: note.id,
      status: "success",
      originalFields: note.fieldValues,
      transformedFields,
      fieldOrder: templateTransform.fieldOrder,
      changed,
    }
  } catch (error) {
    return {
      noteId: note.id,
      status: "error",
      originalFields: note.fieldValues,
      transformedFields: note.fieldValues,
      fieldOrder: noteType.fieldNames,
      changed: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function runBatch({
  notes,
  noteTypes,
  config,
  onProgress,
  signal,
}: {
  notes: ParsedNote[]
  noteTypes: ParsedNoteType[]
  config: BatchConfig
  onProgress?: (progress: BatchProgress) => void
  signal?: AbortSignal
}): Promise<BatchResult> {
  const cardResults: CardResult[] = []
  let successCount = 0
  let failedCount = 0

  for (let i = 0; i < notes.length; i++) {
    if (signal?.aborted) {
      break
    }

    const note = notes[i]
    const noteType = noteTypes.find((nt) => nt.id === note.noteTypeId)
    if (!noteType) {
      failedCount++
      cardResults.push({
        noteId: note.id,
        status: "error",
        originalFields: note.fieldValues,
        transformedFields: note.fieldValues,
        fieldOrder: [],
        changed: false,
        error: "Note type not found",
      })
      continue
    }

    onProgress?.({
      current: i + 1,
      total: notes.length,
      currentNoteId: note.id,
    })

    const fieldMappings = config.fieldMappingsByNoteType[noteType.id] ?? {}
    const templateType = config.templateSelectionsByNoteType[noteType.id] ?? "none"

    const result = await processCard({
      note,
      noteType,
      fieldMappings,
      templateType,
      transformationConfigs: config.transformationConfigs,
      prompt: config.prompt,
    })

    cardResults.push(result)
    if (result.status === "success") {
      successCount++
    } else {
      failedCount++
    }
  }

  return {
    deckId: config.deckId,
    totalCards: notes.length,
    processedCount: cardResults.length,
    successCount,
    failedCount,
    cardResults,
    completedAt: signal?.aborted ? null : new Date().toISOString(),
  }
}

export async function runDryRun({
  notes,
  noteTypes,
  config,
}: {
  notes: ParsedNote[]
  noteTypes: ParsedNoteType[]
  config: BatchConfig
}): Promise<BatchResult> {
  const sampleNotes = notes.slice(0, 5)
  return runBatch({
    notes: sampleNotes,
    noteTypes,
    config,
  })
}
