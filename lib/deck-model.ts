import type { FieldRole } from "@/lib/schema-mapping"
import { detectFieldRoles } from "@/lib/schema-mapping"
import type { ParsedDeckSummary } from "@/lib/apkg-parser-types"
import type { TemplateType } from "@/lib/templates"
import { getBestTemplateMatch } from "@/lib/templates"

export type NoteTypeMapping = {
  noteTypeId: string
  fieldMappings: Record<string, FieldRole>
  templateSelection: TemplateType
}

export type ActiveDeck = {
  id: string
  backupId: string
  fileName: string
  fileSize: number
  importedAt: string
  deck: ParsedDeckSummary
  noteTypeMappings: NoteTypeMapping[]
}

export function createActiveDeck({
  deck,
  backupId,
  fileName,
  fileSize,
}: {
  deck: ParsedDeckSummary
  backupId: string
  fileName: string
  fileSize: number
}): ActiveDeck {
  const noteTypeMappings: NoteTypeMapping[] = deck.noteTypes.map((noteType) => {
    const fieldMappings = Object.fromEntries(
      detectFieldRoles({ noteType, notes: deck.sampleNotes }).map((s) => [
        s.fieldName,
        s.role,
      ])
    )
    const best = getBestTemplateMatch(fieldMappings)
    const templateSelection = best && best.score >= 0.5 ? best.template.id : "none"

    return {
      noteTypeId: noteType.id,
      fieldMappings,
      templateSelection,
    }
  })

  return {
    id: crypto.randomUUID(),
    backupId,
    fileName,
    fileSize,
    importedAt: new Date().toISOString(),
    deck,
    noteTypeMappings,
  }
}

export function getNoteTypeMapping(
  activeDeck: ActiveDeck,
  noteTypeId: string
): NoteTypeMapping | undefined {
  return activeDeck.noteTypeMappings.find((m) => m.noteTypeId === noteTypeId)
}

export function updateFieldMapping(
  activeDeck: ActiveDeck,
  noteTypeId: string,
  fieldName: string,
  role: FieldRole
): ActiveDeck {
  return {
    ...activeDeck,
    noteTypeMappings: activeDeck.noteTypeMappings.map((mapping) => {
      if (mapping.noteTypeId !== noteTypeId) return mapping
      return {
        ...mapping,
        fieldMappings: {
          ...mapping.fieldMappings,
          [fieldName]: role,
        },
      }
    }),
  }
}

export function updateTemplateSelection(
  activeDeck: ActiveDeck,
  noteTypeId: string,
  templateType: TemplateType
): ActiveDeck {
  return {
    ...activeDeck,
    noteTypeMappings: activeDeck.noteTypeMappings.map((mapping) => {
      if (mapping.noteTypeId !== noteTypeId) return mapping
      return {
        ...mapping,
        templateSelection: templateType,
      }
    }),
  }
}
