export type ParsedCardTemplate = {
  name: string
  front: string
  back: string
  browserQuestionFormat?: string
  browserAnswerFormat?: string
}

export type ParsedNoteType = {
  id: string
  name: string
  fieldNames: string[]
  templates: ParsedCardTemplate[]
}

export type ParsedNote = {
  id: string
  guid: string
  noteTypeId: string
  fieldValues: string[]
  tags: string[]
}

export type ParsedMediaItem = {
  archiveName: string
  fileName: string
}

export type ParsedDeckSummary = {
  fileName: string
  fileSize: number
  zipEntryCount: number
  collectionFileName: string
  sqliteVersion: string
  tableNames: string[]
  noteCount: number
  cardCount: number
  noteTypeCount: number
  templateCount: number
  fieldCount: number
  mediaCount: number
  noteTypes: ParsedNoteType[]
  sampleNotes: ParsedNote[]
  mediaSamples: ParsedMediaItem[]
}

export type ApkgParserRequest = {
  type: "parse"
  fileName: string
  fileSize: number
  buffer: ArrayBuffer
}

export type ApkgParserResponse =
  | {
      type: "success"
      deck: ParsedDeckSummary
    }
  | {
      type: "error"
      message: string
    }
