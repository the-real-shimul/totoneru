import type { ParsedCardTemplate, ParsedNote, ParsedNoteType } from "@/lib/apkg-parser-types"

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function stripConditionalBlocks(template: string) {
  return template
    .replace(/\{\{#([^}]+)\}\}/g, "")
    .replace(/\{\{\/([^}]+)\}\}/g, "")
    .replace(/\{\{\^([^}]+)\}\}/g, "")
}

function replaceClozeSyntax(template: string) {
  return template.replace(/\{\{cloze:([^}]+)\}\}/g, "{{$1}}")
}

export function renderAnkiTemplate({
  template,
  note,
  noteType,
}: {
  template: string
  note: ParsedNote
  noteType: ParsedNoteType
}) {
  let html = replaceClozeSyntax(stripConditionalBlocks(template))

  noteType.fieldNames.forEach((fieldName, index) => {
    const fieldValue = escapeHtml(note.fieldValues[index] ?? "")
    const fieldPattern = new RegExp(`\\{\\{${escapeRegExp(fieldName)}\\}\\}`, "g")
    const textPattern = new RegExp(`\\{\\{text:${escapeRegExp(fieldName)}\\}\\}`, "g")

    html = html.replace(fieldPattern, fieldValue)
    html = html.replace(textPattern, fieldValue)
  })

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
