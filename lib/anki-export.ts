import { decompress } from "fzstd"
import JSZip from "jszip"
import initSqlJs from "sql.js/dist/sql-wasm.js"

import { computeCsum } from "@/lib/anki-checksum"
import type { ActiveDeck } from "@/lib/deck-model"
import { applyTemplateTransform } from "@/lib/templates"
import { applyTransformations } from "@/lib/transformations"
import type { TransformationConfig } from "@/lib/transformations"
import type { BatchResult } from "@/lib/batch-operations"
import type { ManualWord } from "@/lib/manual-words"

const FIELD_SEPARATOR = "\u001f"

export type ExportConfig = {
  activeDeck: ActiveDeck
  transformationConfigs: TransformationConfig[]
  batchResult: BatchResult | null
  manualWords?: ManualWord[]
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

function createZstdStoredFrame(bytes: Uint8Array) {
  const maxBlockSize = 128 * 1024
  const blockCount = Math.max(1, Math.ceil(bytes.length / maxBlockSize))
  const output = new Uint8Array(9 + blockCount * 3 + bytes.length)
  let offset = 0

  output.set([0x28, 0xb5, 0x2f, 0xfd], offset)
  offset += 4

  // Single-segment frame with 4-byte content size, no checksum, no dictionary.
  output[offset++] = 0xa0
  output[offset++] = bytes.length & 0xff
  output[offset++] = (bytes.length >>> 8) & 0xff
  output[offset++] = (bytes.length >>> 16) & 0xff
  output[offset++] = (bytes.length >>> 24) & 0xff

  for (let start = 0; start < bytes.length || start === 0; start += maxBlockSize) {
    const remaining = bytes.length - start
    const blockSize = Math.max(0, Math.min(maxBlockSize, remaining))
    const isLast = start + blockSize >= bytes.length
    const header = (blockSize << 3) | (isLast ? 1 : 0)

    output[offset++] = header & 0xff
    output[offset++] = (header >>> 8) & 0xff
    output[offset++] = (header >>> 16) & 0xff

    if (blockSize > 0) {
      output.set(bytes.subarray(start, start + blockSize), offset)
      offset += blockSize
    }

    if (isLast) {
      break
    }
  }

  return output.subarray(0, offset)
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

function createGuid() {
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  let guid = ""

  for (let i = 0; i < 10; i++) {
    guid += alphabet[Math.floor(Math.random() * alphabet.length)]
  }

  return guid
}

function getExpressionFieldIndex(activeDeck: ActiveDeck, noteTypeId: string) {
  const noteType = activeDeck.deck.noteTypes.find((nt) => nt.id === noteTypeId)
  const mapping = activeDeck.noteTypeMappings.find((m) => m.noteTypeId === noteTypeId)
  const expressionFieldName = Object.entries(mapping?.fieldMappings ?? {}).find(
    ([, role]) => role === "expression"
  )?.[0]

  if (!noteType) return 0
  const index = expressionFieldName
    ? noteType.fieldNames.indexOf(expressionFieldName)
    : -1

  return index >= 0 ? index : 0
}

async function insertManualWordsIntoImportedDeck(
  db: initSqlJs.Database,
  activeDeck: ActiveDeck,
  manualWords: ManualWord[]
) {
  const words = manualWords.filter(
    (word) => word.targets.includes("deck") && word.expression.trim().length > 0
  )
  const noteType = activeDeck.deck.noteTypes[0]

  if (!noteType || words.length === 0) {
    return { addedNotes: 0, addedCards: 0 }
  }

  const now = Math.floor(Date.now() / 1000)
  const noteBase = Date.now()
  const cardBase = noteBase + 100000
  const expressionIndex = getExpressionFieldIndex(activeDeck, noteType.id)
  const deckRow = db.exec("SELECT did FROM cards ORDER BY id LIMIT 1")
  const deckId = Number(deckRow[0]?.values?.[0]?.[0] ?? 1)
  const dueRow = db.exec("SELECT max(due) FROM cards")
  let due = Number(dueRow[0]?.values?.[0]?.[0] ?? 0) + 1
  let addedCards = 0

  for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
    const word = words[wordIndex]
    const fields = noteType.fieldNames.map(() => "")
    fields[expressionIndex] = word.expression.trim()
    const flds = joinFields(fields)
    const noteId = noteBase + wordIndex
    const csum = await computeCsum(word.expression.trim())

    db.run(
      `INSERT INTO notes
        (id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        noteId,
        createGuid(),
        Number(noteType.id),
        now,
        -1,
        " totoneru ",
        flds,
        word.expression.trim(),
        csum,
        0,
        "",
      ]
    )

    const templateCount = Math.max(1, noteType.templates.length)
    for (let ord = 0; ord < templateCount; ord++) {
      db.run(
        `INSERT INTO cards
          (id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cardBase + addedCards,
          noteId,
          deckId,
          ord,
          now,
          -1,
          0,
          0,
          due++,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          "",
        ]
      )
      addedCards++
    }
  }

  return { addedNotes: words.length, addedCards }
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
    const collectionWasCompressed = isZstdFrame(rawCollectionBytes)
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

      const manualInsertResult = await insertManualWordsIntoImportedDeck(
        db,
        config.activeDeck,
        config.manualWords ?? []
      )
      changedCount += manualInsertResult.addedNotes

      const exported = db.export()
      const newCollectionBytes = new Uint8Array(exported)
      const replacementCollectionBytes = collectionWasCompressed
        ? createZstdStoredFrame(newCollectionBytes)
        : newCollectionBytes

      // Verify: can Anki-style decompression and SQLite opening both succeed?
      let verified = false
      try {
        const verifyCollectionBytes = await decompressIfNeeded(replacementCollectionBytes)
        const verifyDb = new SQL.Database(verifyCollectionBytes)
        const verifyResult = verifyDb.exec("SELECT count(*) FROM notes")
        if (verifyResult.length > 0) {
          verified = true
        }
        verifyDb.close()
      } catch {
        verified = false
      }

      // Replace collection in zip
      zip.file(collectionEntry.name, replacementCollectionBytes)

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

function createStandaloneModelsJson() {
  return JSON.stringify({
    "1700000000000": {
      id: 1700000000000,
      name: "totoneru Manual Vocabulary",
      type: 0,
      mod: Math.floor(Date.now() / 1000),
      usn: -1,
      sortf: 0,
      did: 1,
      tmpls: [
        {
          name: "Basic expression",
          ord: 0,
          qfmt: "{{Expression}}",
          afmt: "{{FrontSide}}<hr id=answer>{{Reading}}<br>{{Meaning}}<br>{{Sentence}}<br>{{Translation}}<br>{{Notes}}",
          did: null,
          bqfmt: "",
          bafmt: "",
        },
        {
          name: "Japanese vocabulary",
          ord: 1,
          qfmt: "{{Expression}}<br>{{Reading}}",
          afmt: "{{FrontSide}}<hr id=answer>{{Meaning}}<br>{{Sentence}}<br>{{Translation}}<br>{{Notes}}",
          did: null,
          bqfmt: "",
          bafmt: "",
        },
      ],
      flds: [
        { name: "Expression", ord: 0, sticky: false, rtl: false, font: "Arial", size: 20 },
        { name: "Reading", ord: 1, sticky: false, rtl: false, font: "Arial", size: 20 },
        { name: "Meaning", ord: 2, sticky: false, rtl: false, font: "Arial", size: 20 },
        { name: "Sentence", ord: 3, sticky: false, rtl: false, font: "Arial", size: 20 },
        { name: "Translation", ord: 4, sticky: false, rtl: false, font: "Arial", size: 20 },
        { name: "Notes", ord: 5, sticky: false, rtl: false, font: "Arial", size: 20 },
      ],
      css: ".card { font-family: arial; font-size: 20px; text-align: center; color: black; background: white; }",
      latexPre: "\\documentclass[12pt]{article}",
      latexPost: "\\end{document}",
    },
  })
}

function createStandaloneDecksJson() {
  return JSON.stringify({
    "1": {
      id: 1,
      name: "totoneru manual words",
      desc: "Created by totoneru",
      mod: Math.floor(Date.now() / 1000),
      usn: -1,
      collapsed: false,
      browserCollapsed: false,
      dyn: 0,
      conf: 1,
      extendNew: 10,
      extendRev: 50,
      reviewLimit: null,
      newLimit: null,
    },
  })
}

export function buildManualWordsCsv(words: ManualWord[]) {
  return buildManualWordsDelimited(words, ",")
}

export function buildManualWordsTsv(words: ManualWord[]) {
  return buildManualWordsDelimited(words, "\t")
}

function buildManualWordsDelimited(words: ManualWord[], delimiter: "," | "\t") {
  const rows = getManualWordRows(words)

  if (delimiter === "\t") {
    return rows
      .map((row) =>
        row
          .map((value) => String(value).replaceAll("\t", " ").replaceAll("\n", " "))
          .join("\t")
      )
      .join("\n")
  }

  return rows
    .map((row) =>
      row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")
    )
    .join("\n")
}

function getManualWordRows(words: ManualWord[]) {
  return [
    ["Expression", "Reading", "Meaning", "Sentence", "Translation", "Notes"],
    ...words
      .filter((word) => word.targets.includes("standalone"))
      .map((word) => [
        word.expression,
        word.generatedFields.reading ?? "",
        word.generatedFields.meaning ?? "",
        word.generatedFields.sentence ?? "",
        word.generatedFields.translation ?? "",
        word.generatedFields.notes ?? "",
      ]),
  ]
}

export async function buildStandaloneManualWordsApkg(words: ManualWord[]) {
  const standaloneWords = words.filter(
    (word) => word.targets.includes("standalone") && word.expression.trim().length > 0
  )
  const SQL = await getSql()
  const db = new SQL.Database()
  const now = Math.floor(Date.now() / 1000)
  const noteTypeId = 1700000000000

  try {
    db.run(`
      CREATE TABLE col (
        id integer primary key,
        crt integer not null,
        mod integer not null,
        scm integer not null,
        ver integer not null,
        dty integer not null,
        usn integer not null,
        ls integer not null,
        conf text not null,
        models text not null,
        decks text not null,
        dconf text not null,
        tags text not null
      );
    `)
    db.run(`
      CREATE TABLE notes (
        id integer primary key,
        guid text not null,
        mid integer not null,
        mod integer not null,
        usn integer not null,
        tags text not null,
        flds text not null,
        sfld integer not null,
        csum integer not null,
        flags integer not null,
        data text not null
      );
    `)
    db.run(`
      CREATE TABLE cards (
        id integer primary key,
        nid integer not null,
        did integer not null,
        ord integer not null,
        mod integer not null,
        usn integer not null,
        type integer not null,
        queue integer not null,
        due integer not null,
        ivl integer not null,
        factor integer not null,
        reps integer not null,
        lapses integer not null,
        left integer not null,
        odue integer not null,
        odid integer not null,
        flags integer not null,
        data text not null
      );
    `)
    db.run("CREATE TABLE revlog (id integer primary key, cid integer, usn integer, ease integer, ivl integer, lastIvl integer, factor integer, time integer, type integer);")
    db.run("CREATE TABLE graves (usn integer not null, oid integer not null, type integer not null);")
    db.run(
      `INSERT INTO col
        (id, crt, mod, scm, ver, dty, usn, ls, conf, models, decks, dconf, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1,
        now,
        now,
        Date.now(),
        11,
        0,
        -1,
        0,
        "{}",
        createStandaloneModelsJson(),
        createStandaloneDecksJson(),
        "{}",
        "{}",
      ]
    )

    let cardIndex = 0
    for (let index = 0; index < standaloneWords.length; index++) {
      const word = standaloneWords[index]
      const noteId = Date.now() + index
      const fields = [
        word.expression,
        word.generatedFields.reading ?? "",
        word.generatedFields.meaning ?? "",
        word.generatedFields.sentence ?? "",
        word.generatedFields.translation ?? "",
        word.generatedFields.notes ?? "",
      ]
      const csum = await computeCsum(word.expression)

      db.run(
        `INSERT INTO notes
          (id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          noteId,
          createGuid(),
          noteTypeId,
          now,
          -1,
          " totoneru ",
          joinFields(fields),
          word.expression,
          csum,
          0,
          "",
        ]
      )

      const templateOrd = word.template === "japanese-vocab" ? 1 : 0
      db.run(
        `INSERT INTO cards
          (id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Date.now() + 100000 + cardIndex,
          noteId,
          1,
          templateOrd,
          now,
          -1,
          0,
          0,
          cardIndex + 1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          "",
        ]
      )
      cardIndex++
    }

    const zip = new JSZip()
    zip.file("collection.anki21b", createZstdStoredFrame(new Uint8Array(db.export())))
    zip.file("media", "{}")

    return zip.generateAsync({ type: "arraybuffer" })
  } finally {
    db.close()
  }
}
