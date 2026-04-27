import type { FieldRole } from "@/lib/schema-mapping"
import type { ParsedNote, ParsedNoteType } from "@/lib/apkg-parser-types"
import { renderAnkiTemplate } from "@/lib/anki-template-renderer"
import { applyFieldNormalize } from "@/lib/transformations"

export type TemplateType = "expressionFocused" | "vocabulary" | "sentence" | "none"

export type TemplateDefinition = {
  id: TemplateType
  name: string
  description: string
  requiredRoles: FieldRole[]
  optionalRoles: FieldRole[]
  preferredFieldOrder: FieldRole[]
}

export const TEMPLATES: Record<TemplateType, TemplateDefinition> = {
  expressionFocused: {
    id: "expressionFocused",
    name: "Expression Focused",
    description: "Kanji-first card matching the user's Anki expression layout",
    requiredRoles: ["expression", "reading", "meaning", "translation"],
    optionalRoles: ["sentence", "sentenceReading", "audio"],
    preferredFieldOrder: [],
  },
  vocabulary: {
    id: "vocabulary",
    name: "Vocabulary",
    description: "Word-focused cards with reading, meaning, and optional example sentence",
    requiredRoles: ["expression"],
    optionalRoles: ["reading", "meaning", "sentence", "sentenceReading", "translation", "audio"],
    preferredFieldOrder: [
      "expression",
      "reading",
      "meaning",
      "sentence",
      "sentenceReading",
      "translation",
      "audio",
    ],
  },
  sentence: {
    id: "sentence",
    name: "Sentence",
    description: "Sentence-focused cards with translation and optional expression highlight",
    requiredRoles: ["sentence"],
    optionalRoles: ["sentenceReading", "translation", "expression", "meaning", "audio"],
    preferredFieldOrder: [
      "sentence",
      "sentenceReading",
      "translation",
      "expression",
      "meaning",
      "audio",
    ],
  },
  none: {
    id: "none",
    name: "None (keep original)",
    description: "Do not apply a template. Keep the original field order and layout.",
    requiredRoles: [],
    optionalRoles: [],
    preferredFieldOrder: [],
  },
}

export const TEMPLATE_OPTIONS: TemplateType[] = [
  "expressionFocused",
  "vocabulary",
  "sentence",
  "none",
]

export const EXPRESSION_FOCUSED_CSS = `.card {
  font-family: "Hiragino Sans", sans-serif;
  text-align: center;
  font-size: 20px;
}

.expression {
  font-size: 40px;
  font-weight: bold;
  line-height: 1.8;
}

.meaning {
  font-size: 18px;
  color: #555;
  margin-top: 10px;
}

.sentence {
  font-size: 20px;
  color: #ddd;
  line-height: 2.2;
  word-break: keep-all;
}

.sentence-en {
  font-size: 16px;
  color: #888;
  margin-top: 6px;
  font-style: italic;
}

hr { margin: 16px auto; }

ruby rt {
  color: #aaa;
  transition: opacity 0.5s ease;
  opacity: 0;
}

.noFurigana ruby rt { opacity: 0; }
.yesFurigana ruby rt { opacity: 1; }`

export type TemplateMatchResult = {
  template: TemplateDefinition
  score: number
  matchedRequired: number
  totalRequired: number
  matchedOptional: number
  totalOptional: number
  missingRequired: FieldRole[]
}

export function matchTemplates(
  fieldMappings: Record<string, FieldRole>
): TemplateMatchResult[] {
  const presentRoles = new Set(Object.values(fieldMappings))

  return (Object.values(TEMPLATES) as TemplateDefinition[])
    .filter((t) => t.id !== "none")
    .map((template) => {
      if (template.id === "expressionFocused") {
        return matchExpressionFocusedTemplate(template, presentRoles)
      }

      const matchedRequired = template.requiredRoles.filter((r) => presentRoles.has(r)).length
      const matchedOptional = template.optionalRoles.filter((r) => presentRoles.has(r)).length
      const missingRequired = template.requiredRoles.filter((r) => !presentRoles.has(r))

      const requiredScore =
        template.requiredRoles.length > 0 ? matchedRequired / template.requiredRoles.length : 0
      const optionalScore =
        template.optionalRoles.length > 0 ? matchedOptional / template.optionalRoles.length : 0

      const score = requiredScore * 0.8 + optionalScore * 0.2

      return {
        template,
        score,
        matchedRequired,
        totalRequired: template.requiredRoles.length,
        matchedOptional,
        totalOptional: template.optionalRoles.length,
        missingRequired,
      }
    })
    .sort((a, b) => b.score - a.score)
}

function matchExpressionFocusedTemplate(
  template: TemplateDefinition,
  presentRoles: Set<FieldRole>
): TemplateMatchResult {
  const hasExample = presentRoles.has("sentence") || presentRoles.has("sentenceReading")
  const matchedCore = template.requiredRoles.filter((r) => presentRoles.has(r)).length
  const matchedRequired = matchedCore + (hasExample ? 1 : 0)
  const totalRequired = template.requiredRoles.length + 1
  const missingRequired = template.requiredRoles.filter((r) => !presentRoles.has(r))

  if (!hasExample) {
    missingRequired.push("sentence")
  }

  const matchedOptional = template.optionalRoles.filter((r) => presentRoles.has(r)).length
  const totalOptional = template.optionalRoles.length
  const requiredScore = matchedRequired / totalRequired
  const optionalScore = totalOptional > 0 ? matchedOptional / totalOptional : 0
  const score =
    requiredScore === 1 ? requiredScore * 0.95 + optionalScore * 0.05 : requiredScore * 0.45

  return {
    template,
    score,
    matchedRequired,
    totalRequired,
    matchedOptional,
    totalOptional,
    missingRequired,
  }
}

export function getBestTemplateMatch(
  fieldMappings: Record<string, FieldRole>
): TemplateMatchResult | null {
  const results = matchTemplates(fieldMappings)
  return results[0] ?? null
}

export type TemplateTransformResult = {
  note: ParsedNote
  fieldOrder: string[]
  roleMapping: Record<string, FieldRole>
}

export function applyTemplateTransform({
  note,
  noteType,
  fieldMappings,
  templateType,
}: {
  note: ParsedNote
  noteType: ParsedNoteType
  fieldMappings: Record<string, FieldRole>
  templateType: TemplateType
}): TemplateTransformResult {
  if (templateType === "none") {
    return {
      note,
      fieldOrder: [...noteType.fieldNames],
      roleMapping: { ...fieldMappings },
    }
  }

  const template = TEMPLATES[templateType]
  const roleToFieldName: Record<string, string> = {}

  for (const [fieldName, role] of Object.entries(fieldMappings)) {
    if (role !== "unknown") {
      roleToFieldName[role] = fieldName
    }
  }

  const orderedFieldNames: string[] = []
  const usedFields = new Set<string>()

  for (const role of template.preferredFieldOrder) {
    const fieldName = roleToFieldName[role]
    if (fieldName && !usedFields.has(fieldName)) {
      orderedFieldNames.push(fieldName)
      usedFields.add(fieldName)
    }
  }

  for (const fieldName of noteType.fieldNames) {
    if (!usedFields.has(fieldName)) {
      orderedFieldNames.push(fieldName)
      usedFields.add(fieldName)
    }
  }

  const fieldNameToIndex = new Map(noteType.fieldNames.map((name, i) => [name, i]))
  const reorderedValues = orderedFieldNames.map((name) => {
    const index = fieldNameToIndex.get(name)
    const raw = index !== undefined ? note.fieldValues[index] ?? "" : ""
    return applyFieldNormalize(raw).value
  })

  const newRoleMapping: Record<string, FieldRole> = {}
  for (const fieldName of orderedFieldNames) {
    newRoleMapping[fieldName] = fieldMappings[fieldName] ?? "unknown"
  }

  return {
    note: {
      ...note,
      fieldValues: reorderedValues,
    },
    fieldOrder: orderedFieldNames,
    roleMapping: newRoleMapping,
  }
}

const templatePreviewStyles = `
  .card-content { display: flex; flex-direction: column; gap: 12px; }
  .expression { font-size: 28px; font-weight: 600; color: #1A1A1A; }
  .reading { font-size: 18px; color: #7A7671; }
  .meaning { font-size: 16px; color: #4A4744; line-height: 1.55; }
  .sentence { font-size: 20px; font-weight: 500; color: #1A1A1A; }
  .sentence-reading { font-size: 16px; color: #7A7671; }
  .translation { font-size: 16px; color: #4A4744; line-height: 1.55; border-top: 1px solid rgba(26,26,26,0.08); padding-top: 12px; margin-top: 4px; }
  .empty { color: #A39E96; font-size: 14px; }
`

export function getTemplatePreviewStyles(templateType?: TemplateType): string {
  if (templateType === "expressionFocused") {
    return EXPRESSION_FOCUSED_CSS
  }

  return templatePreviewStyles
}

function getRoleToFieldName(fieldMappings: Record<string, FieldRole>) {
  const roleToFieldName: Partial<Record<FieldRole, string>> = {}

  for (const [fieldName, role] of Object.entries(fieldMappings)) {
    if (role !== "unknown" && !roleToFieldName[role]) {
      roleToFieldName[role] = fieldName
    }
  }

  return roleToFieldName
}

export function getExpressionFocusedMissingRoles(fieldMappings: Record<string, FieldRole>) {
  const presentRoles = new Set(Object.values(fieldMappings))
  const missing: string[] = []

  if (!presentRoles.has("expression")) missing.push("Expression")
  if (!presentRoles.has("reading")) missing.push("Reading")
  if (!presentRoles.has("meaning")) missing.push("Meaning")
  if (!presentRoles.has("sentence") && !presentRoles.has("sentenceReading")) {
    missing.push("Sentence or Sentence reading")
  }
  if (!presentRoles.has("translation")) missing.push("Translation")

  return missing
}

export function getExpressionFocusedAnkiTemplate({
  fieldMappings,
}: {
  noteType: ParsedNoteType
  fieldMappings: Record<string, FieldRole>
}): { name: string; front: string; back: string; css: string } | null {
  const roleToFieldName = getRoleToFieldName(fieldMappings)
  const expression = roleToFieldName.expression
  const reading = roleToFieldName.reading
  const meaning = roleToFieldName.meaning
  const sentence = roleToFieldName.sentenceReading ?? roleToFieldName.sentence
  const translation = roleToFieldName.translation

  if (!expression || !reading || !meaning || !sentence || !translation) {
    return null
  }

  return {
    name: TEMPLATES.expressionFocused.name,
    front: `<div class="expression">{{${expression}}}</div>`,
    back: `<div class="expression">
  <div id="wordReading" class="noFurigana">{{furigana:${reading}}}</div>
</div>

<div class="meaning">{{${meaning}}}</div>

<hr>

<div id="sentReading" class="noFurigana sentence">{{furigana:${sentence}}}</div>
<div class="sentence-en">{{${translation}}}</div>

<script>
setTimeout(function() {
  document.getElementById("wordReading").classList.add("yesFurigana");
  document.getElementById("sentReading").classList.add("yesFurigana");
}, 3000);
</script>`,
    css: EXPRESSION_FOCUSED_CSS,
  }
}

export function renderTemplatePreviewHtml({
  note,
  noteType,
  fieldMappings,
  templateType,
  face,
}: {
  note: ParsedNote
  noteType: ParsedNoteType
  fieldMappings: Record<string, FieldRole>
  templateType: TemplateType
  face: "front" | "back"
}): string {
  if (templateType === "none") {
    return `<p class="empty">No template applied. Select a template to see a structured preview.</p>`
  }

  const roleToFieldName: Record<string, string> = {}
  for (const [fieldName, role] of Object.entries(fieldMappings)) {
    if (role !== "unknown") {
      roleToFieldName[role] = fieldName
    }
  }

  const getValue = (role: FieldRole): string => {
    const fieldName = roleToFieldName[role]
    if (!fieldName) return ""
    const index = noteType.fieldNames.indexOf(fieldName)
    return index >= 0 ? note.fieldValues[index] ?? "" : ""
  }

  const esc = (s: string) =>
    s
      .replace(/&nbsp;/gi, "\u00a0")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
  const renderBlock = (role: FieldRole, className: string) => {
    const value = getValue(role)
    if (!value) return ""
    return `<div class="${className}">${esc(value)}</div>`
  }

  if (templateType === "expressionFocused") {
    const focusedTemplate = getExpressionFocusedAnkiTemplate({ noteType, fieldMappings })

    if (!focusedTemplate) {
      const missing = getExpressionFocusedMissingRoles(fieldMappings).join(", ")
      return `<p class="empty">Expression Focused needs mapped fields: ${esc(missing)}.</p>`
    }

    return renderAnkiTemplate({
      template: face === "front" ? focusedTemplate.front : focusedTemplate.back,
      note,
      noteType,
    })
  }

  if (templateType === "vocabulary") {
    const expression = getValue("expression")
    if (face === "front") {
      return `<div class="card-content">
        <div class="expression">${expression ? esc(expression) : '<span class="empty">(no expression)</span>'}</div>
        ${renderBlock("reading", "reading")}
      </div>`
    }
    return `<div class="card-content">
      <div class="expression">${expression ? esc(expression) : '<span class="empty">(no expression)</span>'}</div>
      ${renderBlock("reading", "reading")}
      ${renderBlock("meaning", "meaning")}
      ${renderBlock("sentence", "sentence")}
    </div>`
  }

  if (templateType === "sentence") {
    const sentence = getValue("sentence")
    if (face === "front") {
      return `<div class="card-content">
        <div class="sentence">${sentence ? esc(sentence) : '<span class="empty">(no sentence)</span>'}</div>
        ${renderBlock("sentenceReading", "sentence-reading")}
      </div>`
    }
    return `<div class="card-content">
      <div class="sentence">${sentence ? esc(sentence) : '<span class="empty">(no sentence)</span>'}</div>
      ${renderBlock("sentenceReading", "sentence-reading")}
      ${renderBlock("translation", "translation")}
      ${renderBlock("expression", "expression")}
    </div>`
  }

  return `<p class="empty">Unknown template type.</p>`
}

export function computeTemplateDiffs({
  originalNote,
  transformedNote,
  originalNoteType,
  transformedFieldOrder,
}: {
  originalNote: ParsedNote
  transformedNote: ParsedNote
  originalNoteType: ParsedNoteType
  transformedFieldOrder: string[]
}): { name: string; before: string; after: string; moved: boolean }[] {
  const originalIndexByName = new Map(originalNoteType.fieldNames.map((n, i) => [n, i]))
  const transformedIndexByName = new Map(transformedFieldOrder.map((n, i) => [n, i]))

  const allFieldNames = new Set([...originalNoteType.fieldNames, ...transformedFieldOrder])
  const diffs: { name: string; before: string; after: string; moved: boolean }[] = []

  for (const name of allFieldNames) {
    const originalIndex = originalIndexByName.get(name)
    const transformedIndex = transformedIndexByName.get(name)

    const before = originalIndex !== undefined ? originalNote.fieldValues[originalIndex] ?? "" : ""
    const after = transformedIndex !== undefined ? transformedNote.fieldValues[transformedIndex] ?? "" : ""
    const moved = originalIndex !== transformedIndex

    if (before !== after || moved) {
      diffs.push({ name, before, after, moved })
    }
  }

  return diffs
}
