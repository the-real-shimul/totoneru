import JSZip from "jszip"
import { decompress } from "fzstd"
import initSqlJs from "sql.js/dist/sql-wasm.js"

import type {
  ApkgParserRequest,
  ApkgParserResponse,
  LoadAllNotesRequest,
  LoadAllNotesResponse,
  ParsedCardTemplate,
  ParsedDeckSummary,
  ParsedMediaItem,
  ParsedNote,
  ParsedNoteType,
} from "@/lib/apkg-parser-types"

type QueryValue = number | string | Uint8Array | null
type NoteRow = [number, string, number, string, string]
type NormalizedFieldRow = [number, number, string]
type NormalizedTemplateRow = [number, number, string, Uint8Array]
type NormalizedNoteTypeRow = [number, string]
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
      locateFile: () => new URL("/sql-wasm.wasm", self.location.origin).href,
    })
  }

  return sqlInitPromise
}

function getFirstValue(values: QueryValue[][] | undefined) {
  return values?.[0]?.[0]
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

function readVarint(bytes: Uint8Array, offset: number) {
  let result = 0
  let shift = 0
  let cursor = offset

  while (cursor < bytes.length) {
    const byte = bytes[cursor]
    result |= (byte & 0x7f) << shift
    cursor += 1

    if ((byte & 0x80) === 0) {
      return { value: result, offset: cursor }
    }

    shift += 7
  }

  return null
}

function parseTemplateConfig(config: Uint8Array) {
  const decoder = new TextDecoder()
  const values: Record<number, string> = {}
  let offset = 0

  while (offset < config.length) {
    const tag = readVarint(config, offset)

    if (!tag) break
    offset = tag.offset

    const fieldNumber = tag.value >> 3
    const wireType = tag.value & 0x07

    if (wireType !== 2) {
      break
    }

    const length = readVarint(config, offset)

    if (!length) break
    offset = length.offset

    const end = offset + length.value

    if (end > config.length) break
    values[fieldNumber] = decoder.decode(config.slice(offset, end))
    offset = end
  }

  return {
    front: values[1] ?? "",
    back: values[2] ?? "",
  }
}

function parseNormalizedNoteTypes(database: initSqlJs.Database): ParsedNoteType[] {
  const noteTypeRows = database.exec("select id, name from notetypes order by id")
  const fieldRows = database.exec("select ntid, ord, name from fields order by ntid, ord")
  const templateRows = database.exec(
    "select ntid, ord, name, config from templates order by ntid, ord"
  )
  const fieldsByNoteType = new Map<string, string[]>()
  const templatesByNoteType = new Map<string, ParsedCardTemplate[]>()

  for (const [noteTypeId, , name] of
    (fieldRows[0]?.values ?? []) as NormalizedFieldRow[]) {
    const key = String(noteTypeId)
    const fields = fieldsByNoteType.get(key) ?? []
    fields.push(name)
    fieldsByNoteType.set(key, fields)
  }

  for (const [noteTypeId, , name, config] of
    (templateRows[0]?.values ?? []) as NormalizedTemplateRow[]) {
    const key = String(noteTypeId)
    const templates = templatesByNoteType.get(key) ?? []
    const { front, back } = parseTemplateConfig(config)

    templates.push({
      name,
      front,
      back,
    })
    templatesByNoteType.set(key, templates)
  }

  return ((noteTypeRows[0]?.values ?? []) as NormalizedNoteTypeRow[]).map(
    ([id, name]) => {
      const key = String(id)

      return {
        id: key,
        name,
        fieldNames: fieldsByNoteType.get(key) ?? [],
        templates: templatesByNoteType.get(key) ?? [],
      }
    }
  )
}

function parseDatabaseNoteTypes(database: initSqlJs.Database) {
  const collectionRow = database.exec("select models from col limit 1")
  const rawModelsJson = String(getFirstValue(collectionRow[0]?.values) ?? "{}")

  if (rawModelsJson.trim().length > 2) {
    return parseNoteTypes(rawModelsJson)
  }

  return parseNormalizedNoteTypes(database)
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
  if (!rawMediaJson?.trim()) {
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
  const rawCollectionBytes = await zip.file(collectionFileName)?.async("uint8array")

  if (!rawCollectionBytes) {
    throw new Error("Unable to read collection.anki21b from the archive.")
  }

  const collectionBytes = await decompressIfNeeded(rawCollectionBytes)
  const rawMediaBytes = await zip.file("media")?.async("uint8array")
  const mediaBytes = rawMediaBytes ? await decompressIfNeeded(rawMediaBytes) : undefined
  const mediaJson = mediaBytes ? new TextDecoder().decode(mediaBytes) : undefined
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

    const sqliteVersion = String(getFirstValue(versionRow[0]?.values) ?? "unknown")
    const tableNames = (tablesRow[0]?.values ?? []).map((value) => String(value[0]))
    const noteTypes = parseDatabaseNoteTypes(database)
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

async function loadAllNotes(request: LoadAllNotesRequest): Promise<{ notes: ParsedNote[]; noteTypes: ParsedNoteType[] }> {
  const zip = await JSZip.loadAsync(request.buffer)
  const entryNames = Object.keys(zip.files)
  const collectionFileName = findSupportedCollectionFile(entryNames)
  const rawCollectionBytes = await zip.file(collectionFileName)?.async("uint8array")

  if (!rawCollectionBytes) {
    throw new Error("Unable to read collection.anki21b from the archive.")
  }

  const collectionBytes = await decompressIfNeeded(rawCollectionBytes)
  const SQL = await getSql()
  const database = new SQL.Database(collectionBytes)

  try {
    const noteTypes = parseDatabaseNoteTypes(database)
    const noteRows = database.exec(
      "select id, guid, mid, flds, tags from notes order by id"
    )

    const notes: ParsedNote[] = ((noteRows[0]?.values ?? []) as NoteRow[]).map(
      ([id, guid, noteTypeId, rawFields, rawTags]) => ({
        id: String(id),
        guid,
        noteTypeId: String(noteTypeId),
        fieldValues: parseNoteFields(rawFields),
        tags: parseTags(rawTags),
      })
    )

    return { notes, noteTypes }
  } finally {
    database.close()
  }
}

self.onmessage = async (event: MessageEvent<ApkgParserRequest | LoadAllNotesRequest>) => {
  const request = event.data

  if (request.type === "loadAllNotes") {
    try {
      const { notes, noteTypes } = await loadAllNotes(request)
      const response: LoadAllNotesResponse = { type: "allNotes", notes, noteTypes }
      self.postMessage(response)
    } catch (error) {
      const response: LoadAllNotesResponse = {
        type: "error",
        message: error instanceof Error ? error.message : "Failed to load notes.",
      }
      self.postMessage(response)
    }
    return
  }

  try {
    const response: ApkgParserResponse = {
      type: "success",
      deck: await parseDeck(request),
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
