"use client"

import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Settings2 } from "lucide-react"
import { useState } from "react"
import {
  createDefaultLayout,
  generateBlockBehaviorScript,
  generateBlockStyles,
  generateCardHtmlFromBlocks,
  moveBlock,
  updateBlock,
  validateLayout,
  type BlockConfig,
  type BlockStyle,
  type LayoutConfig,
  type RevealMode,
} from "@/lib/block-editor"
import { getFieldRoleLabel } from "@/lib/schema-mapping"
import type { FieldRole } from "@/lib/schema-mapping"
import type { ParsedNote, ParsedNoteType } from "@/lib/apkg-parser-types"

const REVEAL_MODE_LABELS: Record<RevealMode, string> = {
  always: "Always visible",
  onFlip: "Reveal on flip",
  delay: "Reveal after delay",
  hover: "Reveal on hover",
}

const FONT_SIZE_OPTIONS = [14, 16, 18, 20, 24, 28, 32]

export function BlockEditor({
  availableRoles,
  initialLayout,
  onLayoutChange,
}: {
  availableRoles: FieldRole[]
  initialLayout?: LayoutConfig
  onLayoutChange: (layout: LayoutConfig) => void
}) {
  const [layout, setLayout] = useState<LayoutConfig>(() =>
    initialLayout ?? createDefaultLayout(availableRoles)
  )
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [editingBlock, setEditingBlock] = useState<FieldRole | null>(null)

  function handleMove(fromIndex: number, toIndex: number) {
    const updated = moveBlock(layout, fromIndex, toIndex)
    setLayout(updated)
    onLayoutChange(updated)
  }

  function handleToggleVisible(role: FieldRole) {
    const block = layout.blocks.find((b) => b.role === role)
    if (!block) return
    const updated = updateBlock(layout, role, { visible: !block.visible })
    setLayout(updated)
    onLayoutChange(updated)
  }

  function handleUpdateStyle(role: FieldRole, style: Partial<BlockStyle>) {
    const block = layout.blocks.find((b) => b.role === role)
    if (!block) return
    const updated = updateBlock(layout, role, {
      style: { ...block.style, ...style },
    })
    setLayout(updated)
    onLayoutChange(updated)
  }

  function handleUpdateReveal(role: FieldRole, revealMode: RevealMode) {
    const block = layout.blocks.find((b) => b.role === role)
    if (!block) return
    const updated = updateBlock(layout, role, {
      behavior: { ...block.behavior, revealMode },
    })
    setLayout(updated)
    onLayoutChange(updated)
  }

  function handleUpdateDelay(role: FieldRole, delayMs: number) {
    const block = layout.blocks.find((b) => b.role === role)
    if (!block) return
    const updated = updateBlock(layout, role, {
      behavior: { ...block.behavior, delayMs },
    })
    setLayout(updated)
    onLayoutChange(updated)
  }

  const issues = validateLayout(layout)

  return (
    <div className="space-y-4">
      {issues.length > 0 && (
        <div className="space-y-1">
          {issues.map((issue, i) => (
            <div
              key={i}
              className={` px-3 py-2 text-[12px] ${
                issue.severity === "error"
                  ? "bg-[rgba(217,58,38,0.10)] text-[#A8321A]"
                  : "bg-[rgba(184,135,58,0.12)] text-[#8A6528]"
              }`}
            >
              {issue.message}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {layout.blocks.map((block, index) => (
          <div key={block.role}>
            <div
              draggable
              onDragStart={() => setDraggedIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedIndex !== null && draggedIndex !== index) {
                  handleMove(draggedIndex, index)
                }
                setDraggedIndex(null)
              }}
              className={`flex items-center gap-2  border px-3 py-2.5 transition-colors ${
                block.visible
                  ? "border-border bg-white"
                  : "border-border bg-[#f5f5f5] opacity-60"
              }`}
            >
              <button
                type="button"
                className="cursor-grab text-[#757575] hover:text-[#1a1a1a]"
                aria-label="Drag to reorder"
              >
                <GripVertical className="size-4" />
              </button>

              <span className="text-[14px] font-medium text-[#1a1a1a] flex-1">
                {getFieldRoleLabel(block.role)}
              </span>

              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => handleMove(index, Math.max(0, index - 1))}
                  disabled={index === 0}
                  className=" p-1.5 text-[#757575] hover:text-[#1a1a1a] transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  aria-label={`Move ${getFieldRoleLabel(block.role)} up`}
                  title="Move up"
                >
                  <ArrowUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(index, Math.min(layout.blocks.length - 1, index + 1))}
                  disabled={index === layout.blocks.length - 1}
                  className=" p-1.5 text-[#757575] hover:text-[#1a1a1a] transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  aria-label={`Move ${getFieldRoleLabel(block.role)} down`}
                  title="Move down"
                >
                  <ArrowDown className="size-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleToggleVisible(block.role)}
                className=" p-1.5 text-[#757575] hover:text-[#1a1a1a] transition-colors"
                aria-label={block.visible ? "Hide block" : "Show block"}
              >
                {block.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </button>

              <button
                type="button"
                onClick={() =>
                  setEditingBlock(editingBlock === block.role ? null : block.role)
                }
                className={` p-1.5 transition-colors ${
                  editingBlock === block.role
                    ? "text-[#1a1a1a] bg-[#f5f5f5]"
                    : "text-[#757575] hover:text-[#1a1a1a]"
                }`}
                aria-label="Edit block settings"
              >
                <Settings2 className="size-4" />
              </button>
            </div>

            {editingBlock === block.role && (
              <BlockSettingsPanel
                block={block}
                onUpdateStyle={handleUpdateStyle}
                onUpdateReveal={handleUpdateReveal}
                onUpdateDelay={handleUpdateDelay}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function BlockSettingsPanel({
  block,
  onUpdateStyle,
  onUpdateReveal,
  onUpdateDelay,
}: {
  block: BlockConfig
  onUpdateStyle: (role: FieldRole, style: Partial<BlockStyle>) => void
  onUpdateReveal: (role: FieldRole, mode: RevealMode) => void
  onUpdateDelay: (role: FieldRole, delayMs: number) => void
}) {
  return (
    <div className="mt-1 ml-6 border-2 border-black bg-white p-4 space-y-3">
      <div>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#757575] mb-1">
          Font size
        </p>
        <div className="flex flex-wrap gap-1">
          {FONT_SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onUpdateStyle(block.role, { fontSize: size })}
              className={` px-2.5 py-1 text-[13px] ${
                block.style.fontSize === size
                  ? "bg-foreground text-background"
                  : "bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#e5e5e5]"
              }`}
            >
              {size}px
            </button>
          ))}
          <button
            type="button"
            onClick={() => onUpdateStyle(block.role, { fontSize: undefined })}
            className={` px-2.5 py-1 text-[13px] ${
              !block.style.fontSize
                ? "bg-foreground text-background"
                : "bg-[#f5f5f5] text-[#1a1a1a] hover:bg-[#e5e5e5]"
            }`}
          >
            Default
          </button>
        </div>
      </div>

      <div>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#757575] mb-1">
          Style
        </p>
        <label className="flex items-center gap-2 text-[14px] text-[#1a1a1a] cursor-pointer">
          <input
            type="checkbox"
            checked={!!block.style.emphasis}
            onChange={(e) => onUpdateStyle(block.role, { emphasis: e.target.checked })}
            className="size-4 accent-black"
          />
          Bold
        </label>
      </div>

      <div>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#757575] mb-1">
          Reveal mode
        </p>
        <select
          value={block.behavior.revealMode}
          onChange={(e) => onUpdateReveal(block.role, e.target.value as RevealMode)}
          className="w-full border-2 border-black bg-white px-3 py-2 text-[14px] text-[#1a1a1a] outline-none"
        >
          {(Object.keys(REVEAL_MODE_LABELS) as RevealMode[]).map((mode) => (
            <option key={mode} value={mode}>
              {REVEAL_MODE_LABELS[mode]}
            </option>
          ))}
        </select>
      </div>

      {block.behavior.revealMode === "delay" && (
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#757575] mb-1">
            Delay (ms)
          </p>
          <input
            type="number"
            min={100}
            max={10000}
            step={100}
            value={block.behavior.delayMs ?? 1000}
            onChange={(e) => onUpdateDelay(block.role, Number(e.target.value))}
            className="w-full border-2 border-black bg-white px-3 py-2 text-[14px] text-[#1a1a1a] outline-none"
          />
        </div>
      )}
    </div>
  )
}

export function generatePreviewWithBlocks({
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
}): { html: string; styles: string; script: string } {
  const html = generateCardHtmlFromBlocks({ note, noteType, fieldMappings, layout, face })
  const styles = generateBlockStyles(layout)
  const script = generateBlockBehaviorScript(layout)

  return { html, styles, script }
}
