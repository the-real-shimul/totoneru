import type { ParsedNote, ParsedNoteType } from "@/lib/apkg-parser-types"
import { stripHtml } from "@/lib/transformations"

export type FieldRole =
  | "expression"
  | "reading"
  | "meaning"
  | "sentence"
  | "sentenceReading"
  | "translation"
  | "audio"
  | "unknown"

export type FieldRoleSuggestion = {
  fieldName: string
  role: FieldRole
  confidence: number
  reasons: string[]
}

const roleLabels: Record<FieldRole, string> = {
  expression: "Expression",
  reading: "Reading",
  meaning: "Meaning",
  sentence: "Sentence",
  sentenceReading: "Sentence reading",
  translation: "Translation",
  audio: "Audio",
  unknown: "Unknown",
}

export function getFieldRoleLabel(role: FieldRole) {
  return roleLabels[role]
}

export function detectFieldRoles({
  noteType,
  notes,
}: {
  noteType: ParsedNoteType
  notes: ParsedNote[]
}): FieldRoleSuggestion[] {
  const matchingNotes = notes.filter((note) => note.noteTypeId === noteType.id)

  return noteType.fieldNames.map((fieldName, index) => {
    const samples = matchingNotes.map((note) => note.fieldValues[index] ?? "")
    return detectFieldRole(fieldName, samples)
  })
}

function detectFieldRole(fieldName: string, samples: string[]): FieldRoleSuggestion {
  const normalizedName = fieldName.toLowerCase().replace(/[\s_-]+/g, "")
  const candidates = [
    scoreExpression(normalizedName, samples),
    scoreReading(normalizedName, samples),
    scoreMeaning(normalizedName, samples),
    scoreSentence(normalizedName, samples),
    scoreSentenceReading(normalizedName, samples),
    scoreTranslation(normalizedName, samples),
    scoreAudio(normalizedName, samples),
  ].sort((left, right) => right.confidence - left.confidence)
  const best = candidates[0]

  if (!best || best.confidence < 0.35) {
    return {
      fieldName,
      role: "unknown",
      confidence: 0,
      reasons: ["No strong name or content match"],
    }
  }

  return {
    fieldName,
    ...best,
  }
}

function scoreExpression(fieldName: string, samples: string[]) {
  const reasons: string[] = []
  let score = 0

  if (/(expression|word|term|vocab|kanji|front)/.test(fieldName)) {
    score += 0.65
    reasons.push("field name matches expression")
  }

  if (hasJapanese(samples) && averageTextLength(samples) < 24) {
    score += 0.2
    reasons.push("short Japanese values")
  }

  return suggestion("expression", score, reasons)
}

function scoreReading(fieldName: string, samples: string[]) {
  const reasons: string[] = []
  let score = 0

  if (/(reading|kana|furigana|yomi)/.test(fieldName)) {
    score += 0.65
    reasons.push("field name matches reading")
  }

  if (mostlyKana(samples)) {
    score += 0.25
    reasons.push("values are mostly kana")
  }

  return suggestion("reading", score, reasons)
}

function scoreMeaning(fieldName: string, samples: string[]) {
  const reasons: string[] = []
  let score = 0

  if (/(meaning|definition|gloss|back)/.test(fieldName)) {
    score += 0.7
    reasons.push("field name matches meaning")
  }

  if (mostlyLatin(samples) && averageTextLength(samples) < 80) {
    score += 0.15
    reasons.push("short Latin text")
  }

  return suggestion("meaning", score, reasons)
}

function scoreSentence(fieldName: string, samples: string[]) {
  const reasons: string[] = []
  let score = 0

  if (/(sentence|example|例文)/.test(fieldName) && !/(reading|kana|translation|english)/.test(fieldName)) {
    score += 0.65
    reasons.push("field name matches sentence")
  }

  if (hasJapanese(samples) && averageTextLength(samples) >= 24) {
    score += 0.2
    reasons.push("longer Japanese values")
  }

  return suggestion("sentence", score, reasons)
}

function scoreSentenceReading(fieldName: string, samples: string[]) {
  const reasons: string[] = []
  let score = 0

  if (/(sentencereading|sentencekana|examplekana|例文読み)/.test(fieldName)) {
    score += 0.75
    reasons.push("field name matches sentence reading")
  }

  if (mostlyKana(samples) && averageTextLength(samples) >= 24) {
    score += 0.15
    reasons.push("longer kana values")
  }

  return suggestion("sentenceReading", score, reasons)
}

function scoreTranslation(fieldName: string, samples: string[]) {
  const reasons: string[] = []
  let score = 0

  if (/(translation|english|sentenceenglish|englishmeaning)/.test(fieldName)) {
    score += 0.75
    reasons.push("field name matches translation")
  }

  if (mostlyLatin(samples) && averageTextLength(samples) >= 24) {
    score += 0.15
    reasons.push("longer Latin text")
  }

  return suggestion("translation", score, reasons)
}

function scoreAudio(fieldName: string, samples: string[]) {
  const reasons: string[] = []
  let score = 0

  if (/(audio|sound|tts)/.test(fieldName)) {
    score += 0.75
    reasons.push("field name matches audio")
  }

  if (samples.some((sample) => /\[sound:[^\]]+\]/i.test(sample))) {
    score += 0.2
    reasons.push("Anki sound marker found")
  }

  return suggestion("audio", score, reasons)
}

function suggestion(role: Exclude<FieldRole, "unknown">, confidence: number, reasons: string[]) {
  return {
    role,
    confidence: Math.min(confidence, 0.98),
    reasons,
  }
}

function averageTextLength(samples: string[]) {
  const nonEmpty = samples.map(stripHtml).filter(Boolean)

  if (nonEmpty.length === 0) {
    return 0
  }

  return nonEmpty.reduce((total, sample) => total + sample.length, 0) / nonEmpty.length
}

function hasJapanese(samples: string[]) {
  return samples.some((sample) => /[\u3040-\u30ff\u3400-\u9fff]/.test(stripHtml(sample)))
}

function mostlyKana(samples: string[]) {
  const text = samples.map(stripHtml).join("")
  const kana = text.match(/[\u3040-\u30ffー]/g)?.length ?? 0
  const japanese = text.match(/[\u3040-\u30ff\u3400-\u9fffー]/g)?.length ?? 0

  return japanese > 0 && kana / japanese > 0.75
}

function mostlyLatin(samples: string[]) {
  const text = samples.map(stripHtml).join("")
  const latin = text.match(/[a-z]/gi)?.length ?? 0
  const japanese = text.match(/[\u3040-\u30ff\u3400-\u9fff]/g)?.length ?? 0

  return latin > japanese
}


