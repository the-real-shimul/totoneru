import type { ParsedCardTemplate, ParsedNote, ParsedNoteType } from "@/lib/apkg-parser-types"

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function replaceClozeSyntax(template: string) {
  return template.replace(/\{\{cloze:([^}]+)\}\}/g, "{{$1}}")
}

function renderFuriganaValue(value: string) {
  return escapeHtml(decodeCommonEntities(stripHtml(value))).replace(
    /([^\s[\]]+)\[([^\][\n]+)\]/g,
    "<ruby>$1<rt>$2</rt></ruby>"
  )
}

export function renderAnkiTemplate({
  template,
  note,
  noteType,
  frontSide = "",
}: {
  template: string
  note: ParsedNote
  noteType: ParsedNoteType
  frontSide?: string
}) {
  let html = replaceClozeSyntax(renderConditionalBlocks(template, note, noteType))

  noteType.fieldNames.forEach((fieldName, index) => {
    const rawFieldValue = note.fieldValues[index] ?? ""
    const textValue = escapeHtml(decodeCommonEntities(stripHtml(rawFieldValue)))
    const fieldPattern = new RegExp(`\\{\\{${escapeRegExp(fieldName)}\\}\\}`, "g")
    const textPattern = new RegExp(`\\{\\{text:${escapeRegExp(fieldName)}\\}\\}`, "g")
    const furiganaPattern = new RegExp(`\\{\\{furigana:${escapeRegExp(fieldName)}\\}\\}`, "g")

    html = html.replace(furiganaPattern, renderFuriganaValue(rawFieldValue))
    html = html.replace(fieldPattern, rawFieldValue)
    html = html.replace(textPattern, textValue)
  })

  html = html.replace(/\{\{FrontSide\}\}/g, frontSide)
  return html.replace(/\{\{[^}]+\}\}/g, "")
}

export function createPreviewDocument({
  body,
  title,
  extraStyles = "",
}: {
  body: string
  title: string
  extraStyles?: string
}) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root {
        color-scheme: light dark;
        font-family: ui-sans-serif, system-ui, sans-serif;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background: Canvas;
        color: CanvasText;
      }

      .card {
        width: min(100%, 520px);
        line-height: 1.65;
        font-size: 18px;
      }

      .empty {
        color: color-mix(in srgb, CanvasText 50%, transparent);
        font-size: 14px;
      }

      img, audio, video {
        max-width: 100%;
      }

      ${extraStyles}
    </style>
    <title>${escapeHtml(title)}</title>
  </head>
  <body>
    <main class="card">${body.trim() || '<p class="empty">(empty card face)</p>'}</main>
  </body>
</html>`
}

export function getFirstRenderableTemplate(noteType: ParsedNoteType): ParsedCardTemplate | null {
  return noteType.templates[0] ?? null
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "")
}

function decodeCommonEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, "\u00a0")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/g, "'")
}

function getFieldValue(note: ParsedNote, noteType: ParsedNoteType, fieldName: string) {
  const index = noteType.fieldNames.indexOf(fieldName)
  return index >= 0 ? note.fieldValues[index] ?? "" : ""
}

function renderConditionalBlocks(template: string, note: ParsedNote, noteType: ParsedNoteType) {
  let html = template

  for (const fieldName of noteType.fieldNames) {
    const escapedFieldName = escapeRegExp(fieldName)
    const value = getFieldValue(note, noteType, fieldName)
    const hasValue = value.trim().length > 0
    const positivePattern = new RegExp(
      `\\{\\{#${escapedFieldName}\\}\\}([\\s\\S]*?)\\{\\{\\/${escapedFieldName}\\}\\}`,
      "g"
    )
    const negativePattern = new RegExp(
      `\\{\\{\\^${escapedFieldName}\\}\\}([\\s\\S]*?)\\{\\{\\/${escapedFieldName}\\}\\}`,
      "g"
    )

    html = html.replace(positivePattern, hasValue ? "$1" : "")
    html = html.replace(negativePattern, hasValue ? "" : "$1")
  }

  return html
    .replace(/\{\{#[^}]+\}\}[\s\S]*?\{\{\/[^}]+\}\}/g, "")
    .replace(/\{\{\^[^}]+\}\}[\s\S]*?\{\{\/[^}]+\}\}/g, "")
}
