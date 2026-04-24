import type { ParsedNote, ParsedNoteType } from "@/lib/apkg-parser-types"
import type { FieldRole } from "@/lib/schema-mapping"

export type RevealMode = "always" | "onFlip" | "delay" | "hover"

export type BlockStyle = {
  fontSize?: number
  color?: string
  emphasis?: boolean
  hiddenClass?: string
}

export type BlockBehavior = {
  revealMode: RevealMode
  delayMs?: number
}

export type BlockConfig = {
  role: FieldRole
  visible: boolean
  style: BlockStyle
  behavior: BlockBehavior
}

export type LayoutConfig = {
  blocks: BlockConfig[]
  gapPx: number
  maxWidth: number
  centered: boolean
}

export const DEFAULT_BLOCK_CONFIGS: Record<FieldRole, Omit<BlockConfig, "role">> = {
  expression: {
    visible: true,
    style: { fontSize: 28, color: "#1A1A1A", emphasis: true },
    behavior: { revealMode: "always" },
  },
  reading: {
    visible: true,
    style: { fontSize: 18, color: "#7A7671" },
    behavior: { revealMode: "always" },
  },
  meaning: {
    visible: true,
    style: { fontSize: 16, color: "#4A4744" },
    behavior: { revealMode: "onFlip" },
  },
  sentence: {
    visible: true,
    style: { fontSize: 20, color: "#1A1A1A", emphasis: true },
    behavior: { revealMode: "always" },
  },
  sentenceReading: {
    visible: true,
    style: { fontSize: 16, color: "#7A7671" },
    behavior: { revealMode: "always" },
  },
  translation: {
    visible: true,
    style: { fontSize: 16, color: "#4A4744" },
    behavior: { revealMode: "onFlip" },
  },
  audio: {
    visible: true,
    style: {},
    behavior: { revealMode: "always" },
  },
  unknown: {
    visible: true,
    style: { fontSize: 16, color: "#4A4744" },
    behavior: { revealMode: "always" },
  },
}

export function createDefaultLayout(roles: FieldRole[]): LayoutConfig {
  return {
    blocks: roles.map((role) => ({
      role,
      ...DEFAULT_BLOCK_CONFIGS[role],
    })),
    gapPx: 12,
    maxWidth: 520,
    centered: true,
  }
}

export function moveBlock(layout: LayoutConfig, fromIndex: number, toIndex: number): LayoutConfig {
  const blocks = [...layout.blocks]
  const [removed] = blocks.splice(fromIndex, 1)
  blocks.splice(toIndex, 0, removed)
  return { ...layout, blocks }
}

export function updateBlock(
  layout: LayoutConfig,
  role: FieldRole,
  updates: Partial<BlockConfig>
): LayoutConfig {
  return {
    ...layout,
    blocks: layout.blocks.map((block) =>
      block.role === role ? { ...block, ...updates } : block
    ),
  }
}

export function generateBlockStyles(layout: LayoutConfig): string {
  const lines: string[] = [
    ".card-content { display: flex; flex-direction: column; }",
    `.card-content { gap: ${layout.gapPx}px; }`,
    layout.centered
      ? ".card-content { align-items: center; text-align: center; }"
      : ".card-content { align-items: flex-start; text-align: left; }",
    `.card-content { max-width: ${layout.maxWidth}px; width: 100%; margin: 0 auto; }`,
  ]

  for (const block of layout.blocks) {
    if (!block.visible) {
      lines.push(`.block-${block.role} { display: none; }`)
      continue
    }

    const styleRules: string[] = []
    if (block.style.fontSize) {
      styleRules.push(`font-size: ${block.style.fontSize}px`)
    }
    if (block.style.color) {
      styleRules.push(`color: ${block.style.color}`)
    }
    if (block.style.emphasis) {
      styleRules.push("font-weight: 600")
    }

    if (styleRules.length > 0) {
      lines.push(`.block-${block.role} { ${styleRules.join("; ")}; }`)
    }

    if (block.behavior.revealMode === "onFlip") {
      lines.push(`.block-${block.role} { display: none; }`)
      lines.push(`.card-back .block-${block.role} { display: block; }`)
    }
  }

  return lines.join("\n")
}

export function generateBlockBehaviorScript(layout: LayoutConfig): string {
  const delayBlocks = layout.blocks.filter(
    (b) => b.visible && b.behavior.revealMode === "delay" && b.behavior.delayMs
  )

  if (delayBlocks.length === 0) return ""

  const delayCode = delayBlocks
    .map(
      (b) => `
    setTimeout(() => {
      const el = document.querySelector('.block-${b.role}');
      if (el) el.style.opacity = '1';
    }, ${b.behavior.delayMs});`
    )
    .join("\n")

  return `<script>
(function() {
  const style = document.createElement('style');
  style.textContent = '${delayBlocks.map((b) => `.block-${b.role} { opacity: 0; transition: opacity 0.3s ease; }`).join(" ")}';
  document.head.appendChild(style);${delayCode}
})();
<\/script>`
}

export function generateCardHtmlFromBlocks({
  note,
  noteType,
  fieldMappings,
  layout,
  face,
}: {
  note: ParsedNote
  noteType: ParsedNoteType
  fieldMappings: Record<string, FieldRole>
  layout: LayoutConfig
  face: "front" | "back"
}): string {
  const fieldNameToIndex = new Map(noteType.fieldNames.map((name, i) => [name, i]))
  const roleToFieldName: Record<string, string> = {}
  for (const [fieldName, role] of Object.entries(fieldMappings)) {
    roleToFieldName[role] = fieldName
  }

  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

  const visibleBlocks = layout.blocks.filter((b) => b.visible)

  const content = visibleBlocks
    .map((block) => {
      const fieldName = roleToFieldName[block.role]
      if (!fieldName) return ""
      const index = fieldNameToIndex.get(fieldName)
      if (index === undefined) return ""
      const value = note.fieldValues[index] ?? ""
      if (!value) return ""

      if (block.behavior.revealMode === "onFlip" && face === "front") {
        return `<div class="block-${block.role}" style="display:none">${esc(value)}</div>`
      }

      if (block.behavior.revealMode === "delay" && face === "front") {
        return `<div class="block-${block.role}" style="opacity:0;transition:opacity 0.3s ease">${esc(value)}</div>`
      }

      return `<div class="block-${block.role}">${esc(value)}</div>`
    })
    .filter(Boolean)
    .join("\n")

  if (!content) {
    return '<p class="empty">(empty card face)</p>'
  }

  return `<div class="card-content">\n${content}\n</div>`
}

export type ValidationIssue = {
  severity: "warning" | "error"
  message: string
  blockRole?: FieldRole
}

export function validateLayout(layout: LayoutConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  const visibleBlocks = layout.blocks.filter((b) => b.visible)
  if (visibleBlocks.length === 0) {
    issues.push({ severity: "error", message: "At least one block must be visible." })
  }

  const delayBlocks = visibleBlocks.filter((b) => b.behavior.revealMode === "delay")
  for (const block of delayBlocks) {
    if (!block.behavior.delayMs || block.behavior.delayMs < 100) {
      issues.push({
        severity: "warning",
        message: `Delay for ${block.role} should be at least 100ms.`,
        blockRole: block.role,
      })
    }
    if (block.behavior.delayMs && block.behavior.delayMs > 10000) {
      issues.push({
        severity: "warning",
        message: `Delay for ${block.role} exceeds 10s — may feel unresponsive.`,
        blockRole: block.role,
      })
    }
  }

  const hoverBlocks = visibleBlocks.filter((b) => b.behavior.revealMode === "hover")
  if (hoverBlocks.length > 0) {
    issues.push({
      severity: "warning",
      message: "Hover reveal does not work on touch devices. Consider 'delay' or 'onFlip' instead.",
    })
  }

  return issues
}
