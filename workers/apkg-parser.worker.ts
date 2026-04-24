import JSZip from "jszip"
import initSqlJs from "sql.js/dist/sql-wasm.js"

import type {
  ApkgParserRequest,
  ApkgParserResponse,
  ParsedCardTemplate,
  ParsedDeckSummary,
  ParsedMediaItem,
  ParsedNote,
  ParsedNoteType,
} from "@/lib/apkg-parser-types"

type QueryValue = number | string | Uint8Array | null
type NoteRow = [number, string, number, string, string]
type NotetypeJson = {
  name?: string
  flds?: Array<{ name?: string }>
  tmpls?: Array<{
    name?: string
    qfmt?: string
    afmt?: string
    bqfmt?: string
    bafmt?: string
  }>
}

let sqlInitPromise: ReturnType<typeof initSqlJs> | null = null

function getSql() {
  if (!sqlInitPromise) {
    sqlInitPromise = initSqlJs({
      locateFile: () => "/sql-wasm.wasm",
    })
  }

  return sqlInitPromise
}

function getFirstValue(values: QueryValue[][] | undefined) {
  return values?.[0]?.[0]
}

function parseNoteFields(rawFields: string) {
  return rawFields.split("\u001f")
}

function parseTags(rawTags: string) {
  return rawTags.trim().length > 0 ? rawTags.trim().split(/\s+/) : []
}

function parseNoteTypes(rawModelsJson: string): ParsedNoteType[] {
  const parsed = JSON.parse(rawModelsJson) as Record<string, NotetypeJson>

  return Object.entries(parsed)
    .map(([id, noteType]) => ({
      id,
      name: noteType.name ?? `Note type ${id}`,
      fieldNames: (noteType.flds ?? []).map(
        (field, index) => field.name ?? `Field ${index + 1}`
      ),
      templates: parseTemplates(noteType.tmpls ?? []),
    }))
    .sort((left, right) => left.name.localeCompare(right.name))
}

function parseTemplates(templates: NonNullable<NotetypeJson["tmpls"]>): ParsedCardTemplate[] {
  return templates.map((template, index) => ({
    name: template.name ?? `Card ${index + 1}`,
    front: template.qfmt ?? "",
    back: template.afmt ?? "",
    browserQuestionFormat: template.bqfmt,
    browserAnswerFormat: template.bafmt,
  }))
}

function findSupportedCollectionFile(entryNames: string[]) {
  const currentCollection = entryNames.find(
    (entryName) =>
      entryName === "collection.anki21b" || entryName.endsWith("/collection.anki21b")
  )

  if (currentCollection) {
    return currentCollection
  }

  const olderCollection = entryNames.find(
    (entryName) =>
      entryName === "collection.anki2" ||
      entryName === "collection.anki21" ||
      entryName.endsWith("/collection.anki2") ||
      entryName.endsWith("/collection.anki21")
  )

  if (olderCollection) {
    throw new Error("This deck uses an older Anki schema. Totoneru supports collection.anki21b only.")
  }

  throw new Error("This package does not contain collection.anki21b.")
}

function parseMediaItems(rawMediaJson: string | undefined): ParsedMediaItem[] {
  if (!rawMediaJson) {
    return []
  }

  const parsed = JSON.parse(rawMediaJson) as Record<string, string>

  return Object.entries(parsed)
    .map(([archiveName, fileName]) => ({
      archiveName,
      fileName,
    }))
    .sort((left, right) => left.fileName.localeCompare(right.fileName))
}

async function parseDeck(request: ApkgParserRequest): Promise<ParsedDeckSummary> {
  const zip = await JSZip.loadAsync(request.buffer)
  const entryNames = Object.keys(zip.files)
  const collectionFileName = findSupportedCollectionFile(entryNames)
  const collectionBytes = await zip.file(collectionFileName)?.async("uint8array")

  if (!collectionBytes) {
    throw new Error("Unable to read collection.anki21b from the archive.")
  }

  const mediaJson = await zip.file("media")?.async("string")
  const mediaItems = parseMediaItems(mediaJson)
  const SQL = await getSql()
  const database = new SQL.Database(collectionBytes)

  try {
    const versionRow = database.exec("select sqlite_version() as version")
    const tablesRow = database.exec(
      "select name from sqlite_master where type = 'table' order by name"
    )
    const noteRows = database.exec(
      "select id, guid, mid, flds, tags from notes order by id limit 50"
    )
    const noteCountRow = database.exec("select count(*) as count from notes")
    const cardCountRow = database.exec("select count(*) as count from cards")
    const collectionRow = database.exec("select models from col limit 1")

    const sqliteVersion = String(getFirstValue(versionRow[0]?.values) ?? "unknown")
    const tableNames = (tablesRow[0]?.values ?? []).map((value) => String(value[0]))
    const rawModelsJson = String(getFirstValue(collectionRow[0]?.values) ?? "{}")
    const noteTypes = parseNoteTypes(rawModelsJson)
    const sampleNotes: ParsedNote[] = ((noteRows[0]?.values ?? []) as NoteRow[]).map(
      ([id, guid, noteTypeId, rawFields, rawTags]) => ({
        id: String(id),
        guid,
        noteTypeId: String(noteTypeId),
        fieldValues: parseNoteFields(rawFields),
        tags: parseTags(rawTags),
      })
    )
    const noteCount = Number(getFirstValue(noteCountRow[0]?.values) ?? 0)
    const cardCount = Number(getFirstValue(cardCountRow[0]?.values) ?? 0)
    const fieldCount = noteTypes.reduce(
      (total, noteType) => total + noteType.fieldNames.length,
      0
    )
    const templateCount = noteTypes.reduce(
      (total, noteType) => total + noteType.templates.length,
      0
    )

    return {
      fileName: request.fileName,
      fileSize: request.fileSize,
      zipEntryCount: entryNames.length,
      collectionFileName,
      sqliteVersion,
      tableNames,
      noteCount,
      cardCount,
      noteTypeCount: noteTypes.length,
      templateCount,
      fieldCount,
      mediaCount: mediaItems.length,
      noteTypes,
      sampleNotes,
      mediaSamples: mediaItems.slice(0, 8),
    }
  } finally {
    database.close()
  }
}

self.onmessage = async (event: MessageEvent<ApkgParserRequest>) => {
  try {
    const response: ApkgParserResponse = {
      type: "success",
      deck: await parseDeck(event.data),
    }

    self.postMessage(response)
  } catch (error) {
    const response: ApkgParserResponse = {
      type: "error",
      message: error instanceof Error ? error.message : "Failed to inspect the package.",
    }

    self.postMessage(response)
  }
}
