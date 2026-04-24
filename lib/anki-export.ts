import { decompress } from "fzstd"
import JSZip from "jszip"
import initSqlJs from "sql.js/dist/sql-wasm.js"

import { computeCsum } from "@/lib/anki-checksum"
import type { ActiveDeck } from "@/lib/deck-model"
import { applyTemplateTransform } from "@/lib/templates"
import { applyTransformations } from "@/lib/transformations"
import type { TransformationConfig } from "@/lib/transformations"
import type { BatchResult } from "@/lib/batch-operations"

const FIELD_SEPARATOR = "\u001f"

export type ExportConfig = {
  activeDeck: ActiveDeck
  transformationConfigs: TransformationConfig[]
  batchResult: BatchResult | null
}

export type ExportResult = {
  success: boolean
  transformedBuffer: ArrayBuffer | null
  originalBuffer: ArrayBuffer | null
  changedNoteCount: number
  unchangedNoteCount: number
  errorMessage: string
  verified: boolean
}

function isZstdFrame(bytes: Uint8Array) {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x28 &&
    bytes[1] === 0xb5 &&
    bytes[2] === 0x2f &&
    bytes[3] === 0xfd
  )
}

async function decompressIfNeeded(bytes: Uint8Array) {
  if (!isZstdFrame(bytes)) {
    return bytes
  }

  return decompress(bytes)
}

async function getSql() {
  return initSqlJs({
    locateFile: () => new URL("/sql-wasm.wasm", window.location.origin).href,
  })
}

function splitFields(flds: string): string[] {
  return flds.split(FIELD_SEPARATOR)
}

function joinFields(fields: string[]): string {
  return fields.join(FIELD_SEPARATOR)
}

export async function buildTransformedApkg(
  originalBuffer: ArrayBuffer,
  config: ExportConfig
): Promise<ExportResult> {
  try {
    const zip = await JSZip.loadAsync(originalBuffer)
    const collectionEntry = zip.file("collection.anki21b")

    if (!collectionEntry) {
      return {
        success: false,
        transformedBuffer: null,
        originalBuffer,
        changedNoteCount: 0,
        unchangedNoteCount: 0,
        errorMessage: "collection.anki21b not found in archive.",
        verified: false,
      }
    }

    const rawCollectionBytes = await collectionEntry.async("uint8array")
    const collectionBytes = await decompressIfNeeded(rawCollectionBytes)
    const SQL = await getSql()
    const db = new SQL.Database(collectionBytes)

    try {
      const noteTypes = config.activeDeck.deck.noteTypes
      const noteTypeById = new Map(noteTypes.map((nt) => [nt.id, nt]))

      const batchChangesByNoteId = new Map<
        string,
        { transformedFields: string[] }
      >()
      if (config.batchResult) {
        for (const card of config.batchResult.cardResults) {
          if (card.status === "success" && card.changed) {
            batchChangesByNoteId.set(card.noteId, {
              transformedFields: card.transformedFields,
            })
          }
        }
      }

      const mappingByNoteTypeId = new Map(
        config.activeDeck.noteTypeMappings.map((m) => [m.noteTypeId, m])
      )

      const notesResult = db.exec(
        "SELECT id, mid, flds FROM notes ORDER BY id"
      )

      const noteRows = (notesResult[0]?.values ?? []) as [
        number,
        number,
        string
      ][]

      let changedCount = 0
      let unchangedCount = 0
      const now = Math.floor(Date.now() / 1000)

      for (const [id, mid, rawFlds] of noteRows) {
        const noteType = noteTypeById.get(String(mid))
        if (!noteType) {
          unchangedCount++
          continue
        }

        const mapping = mappingByNoteTypeId.get(String(mid))
        const fieldMappings = mapping?.fieldMappings ?? {}

        const originalFields = splitFields(rawFlds)
        const templateTransform = applyTemplateTransform({
          note: {
            id: String(id),
            guid: "",
            noteTypeId: String(mid),
            fieldValues: originalFields,
            tags: [],
          },
          noteType,
          fieldMappings,
          templateType: mapping?.templateSelection ?? "none",
        })
        const fields = [...templateTransform.note.fieldValues]
        const fieldOrder = templateTransform.fieldOrder
        let anyChanged = fields.some((value, index) => value !== originalFields[index])

        // Apply built-in transformations
        for (let i = 0; i < noteType.fieldNames.length; i++) {
          const fieldName = noteType.fieldNames[i]
          const role = fieldMappings[fieldName] ?? "unknown"
          const originalValue = originalFields[i] ?? ""
          const transformedIndex = fieldOrder.indexOf(fieldName)
          if (transformedIndex < 0) continue

          const result = await applyTransformations({
            value: originalValue,
            role,
            configs: config.transformationConfigs,
          })

          if (result.changed) {
            fields[transformedIndex] = result.value
            anyChanged = true
          }
        }

        // Apply batch/AI changes if present
        const batchChange = batchChangesByNoteId.get(String(id))
        if (batchChange) {
          for (let i = 0; i < Math.min(fields.length, batchChange.transformedFields.length); i++) {
            if (fields[i] !== batchChange.transformedFields[i]) {
              fields[i] = batchChange.transformedFields[i]
              anyChanged = true
            }
          }
        }

        if (!anyChanged) {
          unchangedCount++
          continue
        }

        const newFlds = joinFields(fields)
        const csum = await computeCsum(fields[0] ?? "")

        db.run(
          "UPDATE notes SET flds = ?, mod = ?, csum = ? WHERE id = ?",
          [newFlds, now, csum, id]
        )
        changedCount++
      }

      const exported = db.export()
      const newCollectionBytes = new Uint8Array(exported)

      // Verify: can we re-open the exported DB?
      let verified = false
      try {
        const verifyDb = new SQL.Database(newCollectionBytes)
        const verifyResult = verifyDb.exec("SELECT count(*) FROM notes")
        if (verifyResult.length > 0) {
          verified = true
        }
        verifyDb.close()
      } catch {
        verified = false
      }

      // Replace collection in zip
      zip.file("collection.anki21b", newCollectionBytes)

      const newZipBuffer = await zip.generateAsync({ type: "arraybuffer" })

      return {
        success: true,
        transformedBuffer: newZipBuffer,
        originalBuffer,
        changedNoteCount: changedCount,
        unchangedNoteCount: unchangedCount,
        errorMessage: "",
        verified,
      }
    } finally {
      db.close()
    }
  } catch (error) {
    return {
      success: false,
      transformedBuffer: null,
      originalBuffer,
      changedNoteCount: 0,
      unchangedNoteCount: 0,
      errorMessage: error instanceof Error ? error.message : String(error),
      verified: false,
    }
  }
}
