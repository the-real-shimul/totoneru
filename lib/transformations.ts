import { generateFurigana } from "@/lib/kuromoji-client"
import type { FieldRole } from "@/lib/schema-mapping"

export type TransformationType = "furigana" | "htmlClean" | "fieldNormalize"

export type TransformationConfig = {
  type: TransformationType
  enabled: boolean
  targetRoles: FieldRole[]
}

export const DEFAULT_TRANSFORMATIONS: TransformationConfig[] = [
  {
    type: "furigana",
    enabled: false,
    targetRoles: ["expression", "sentence"],
  },
  {
    type: "htmlClean",
    enabled: true,
    targetRoles: [
      "expression",
      "reading",
      "meaning",
      "sentence",
      "sentenceReading",
      "translation",
    ],
  },
  {
    type: "fieldNormalize",
    enabled: true,
    targetRoles: [
      "expression",
      "reading",
      "meaning",
      "sentence",
      "sentenceReading",
      "translation",
    ],
  },
]

export type TransformResult = {
  value: string
  changed: boolean
}

/* ---------- furigana ---------- */

export async function applyFurigana(value: string): Promise<TransformResult> {
  const hasKanji = /[\u4e00-\u9faf]/.test(value)
  if (!hasKanji) {
    return { value, changed: false }
  }

  try {
    const html = await generateFurigana(stripHtml(value))
    return { value: html, changed: html !== value }
  } catch {
    return { value, changed: false }
  }
}

/* ---------- html clean ---------- */

export function applyHtmlClean(value: string): TransformResult {
  const cleaned = value
    .replace(/<\/?(font|span|div|p)[^>]*>/gi, "")
    .replace(/style="[^"]*"/gi, "")
    .replace(/class="[^"]*"/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  return { value: cleaned, changed: cleaned !== value }
}

/* ---------- field normalize ---------- */

export function applyFieldNormalize(value: string): TransformResult {
  const normalized = value
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  return { value: normalized, changed: normalized !== value }
}

/* ---------- combined apply ---------- */

export async function applyTransformations({
  value,
  role,
  configs,
}: {
  value: string
  role: FieldRole
  configs: TransformationConfig[]
}): Promise<TransformResult> {
  let current = value
  let anyChanged = false

  for (const config of configs) {
    if (!config.enabled) continue
    if (!config.targetRoles.includes(role)) continue

    let result: TransformResult

    switch (config.type) {
      case "furigana":
        result = await applyFurigana(current)
        break
      case "htmlClean":
        result = applyHtmlClean(current)
        break
      case "fieldNormalize":
        result = applyFieldNormalize(current)
        break
      default:
        continue
    }

    current = result.value
    if (result.changed) anyChanged = true
  }

  return { value: current, changed: anyChanged }
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim()
}
