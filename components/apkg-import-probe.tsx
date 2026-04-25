"use client"

import { ChevronLeft, ChevronRight, LoaderCircle, Play, Upload, X } from "lucide-react"
import { useCallback, useId, useMemo, useRef, useState, useTransition, useEffect } from "react"

import { Button } from "@/components/ui/button"
import {
  createPreviewDocument,
  getFirstRenderableTemplate,
  renderAnkiTemplate,
} from "@/lib/anki-template-renderer"
import { saveOriginalDeckBackup, saveActiveDeck, loadMostRecentActiveDeck, deleteActiveDeck, deleteBackup, deleteAllStaleDeckRecords } from "@/lib/deck-storage"
import type {
  ApkgParserRequest,
  ApkgParserResponse,
  ParsedDeckSummary,
  ParsedNote,
  ParsedNoteType,
} from "@/lib/apkg-parser-types"
import {
  detectFieldRoles,
  getFieldRoleLabel,
  type FieldRole,
  type FieldRoleSuggestion,
} from "@/lib/schema-mapping"
import {
  applyTemplateTransform,
  computeTemplateDiffs,
  getBestTemplateMatch,
  getTemplatePreviewStyles,
  renderTemplatePreviewHtml,
  TEMPLATE_OPTIONS,
  TEMPLATES,
  type TemplateType,
} from "@/lib/templates"
import {
  createActiveDeck,
  updateFieldMapping,
  updateTemplateSelection,
  type ActiveDeck,
} from "@/lib/deck-model"
import {
  applyTransformations,
  DEFAULT_TRANSFORMATIONS,
  type TransformationConfig,
  type TransformationType,
} from "@/lib/transformations"
import type { BatchResult } from "@/lib/batch-operations"
import { AiSettings } from "@/components/ai-settings"
import { BatchRunner } from "@/components/batch-runner"
import { BlockEditor, generatePreviewWithBlocks } from "@/components/block-editor"
import { ExportPanel } from "@/components/export-panel"
import { PromptEditor, PromptLibrary } from "@/components/prompt-library"
import type { UserPrompt } from "@/lib/prompts"
import { estimateCost, estimateTokens, interpolatePrompt, sanitizeAiOutput } from "@/lib/prompts"
import { sendAiRequest } from "@/lib/ai-client"
import { getActiveApiKey } from "@/lib/ai-keys"
import type { AiMessage } from "@/lib/ai-types"
import type { LayoutConfig } from "@/lib/block-editor"

type FieldDiff = {
  name: string
  before: string
  after: string
  moved?: boolean
}

type ProbeState =
  | { status: "loading" }
  | { status: "idle" }
  | { status: "success"; activeDeck: ActiveDeck }
  | { status: "error"; message: string }

const fieldRoleOptions: FieldRole[] = [
  "expression",
  "reading",
  "meaning",
  "sentence",
  "sentenceReading",
  "translation",
  "audio",
  "unknown",
]

const EMPTY_FIELD_MAPPINGS: Record<string, FieldRole> = {}

function parseApkgInWorker(file: File, buffer: ArrayBuffer) {
  return new Promise<ParsedDeckSummary>((resolve, reject) => {
    const worker = new Worker(new URL("../workers/apkg-parser.worker.ts", import.meta.url), {
      type: "module",
    })

    worker.onmessage = (event: MessageEvent<ApkgParserResponse>) => {
      worker.terminate()
      if (event.data.type === "success") {
        resolve(event.data.deck)
        return
      }
      reject(new Error(event.data.message))
    }

    worker.onerror = (event) => {
      worker.terminate()
      reject(new Error(event.message || "The APKG parser worker failed."))
    }

    const message: ApkgParserRequest = {
      type: "parse",
      fileName: file.name,
      fileSize: file.size,
      buffer,
    }

    worker.postMessage(message, [buffer])
  })
}

export function ApkgImportProbe() {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [result, setResult] = useState<ProbeState>({ status: "loading" })
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    loadMostRecentActiveDeck().then((activeDeck) => {
      if (!cancelled) {
        setResult(activeDeck ? { status: "success", activeDeck } : { status: "idle" })
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  function handleClearWorkspace() {
    if (result.status === "success") {
      if (!window.confirm("Clear workspace? Your field mappings and template selections will be lost. The original deck backup will also be removed.")) {
        return
      }
      const { id, backupId } = result.activeDeck
      Promise.all([deleteActiveDeck(id), deleteBackup(backupId)]).then(() => {
        setResult({ status: "idle" })
      })
    }
  }

  function handleFileChange(file: File | null) {
    if (!file) return

    startTransition(async () => {
      try {
        const backupBuffer = await file.arrayBuffer()
        const parseBuffer = backupBuffer.slice(0)
        const backup = await saveOriginalDeckBackup(file, backupBuffer)
        const deck = await parseApkgInWorker(file, parseBuffer)
        const activeDeck = createActiveDeck({
          deck,
          backupId: backup.id,
          fileName: backup.fileName,
          fileSize: backup.fileSize,
        })
        await saveActiveDeck(activeDeck)
        await deleteAllStaleDeckRecords(activeDeck.id)
        setResult({ status: "success", activeDeck })
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to inspect the package."
        setResult({ status: "error", message })
      } finally {
        if (inputRef.current) {
          inputRef.current.value = ""
        }
      }
    })
  }

  return (
    <div className="space-y-5">
      {/* Upload card */}
      <div className="rounded-[20px] border border-border bg-card p-10 shadow-[0_1px_3px_rgba(26,26,26,0.03)]">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept=".apkg,application/octet-stream"
          className="sr-only"
          onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
        />

        {result.status === "loading" && (
          <div className="flex items-center gap-3 py-6 text-muted-foreground">
            <LoaderCircle className="animate-spin size-5" />
            <span className="text-[14px]">Restoring workspace…</span>
          </div>
        )}

        {result.status === "idle" && (
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <p className="text-[20px] font-medium text-foreground">Choose a deck to import</p>
              <p className="text-[15px] leading-[1.55] text-[#4A4744]">
                Reads notes, note types, templates, and media manifest entirely in the browser.
                Nothing is uploaded.
              </p>
            </div>
            <Button
              type="button"
              size="lg"
              className="shrink-0"
              onClick={() => document.getElementById(inputId)?.click()}
              disabled={isPending}
            >
              {isPending ? <LoaderCircle className="animate-spin" /> : <Upload />}
              {isPending ? "Reading deck…" : "Choose .apkg"}
            </Button>
          </div>
        )}

        {result.status === "error" && (
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-[15px] font-medium text-destructive">Import failed</p>
              <p className="text-[15px] leading-[1.55] text-[#4A4744]">{result.message}</p>
            </div>
            <Button
              type="button"
              size="lg"
              className="shrink-0"
              onClick={() => {
                setResult({ status: "idle" })
                document.getElementById(inputId)?.click()
              }}
            >
              <Upload />
              Try again
            </Button>
          </div>
        )}

        {result.status === "success" && (
          <div className="flex items-center justify-between gap-6">
            <div className="space-y-1">
              <p className="text-[15px] font-medium text-foreground">{result.activeDeck.fileName}</p>
              <p className="font-mono text-[12px] text-muted-foreground">
                Active workspace · {Math.round(result.activeDeck.fileSize / 1024)} KB ·{" "}
                {new Date(result.activeDeck.importedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearWorkspace}
              >
                <X />
                Clear
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById(inputId)?.click()}
                disabled={isPending}
              >
                {isPending ? <LoaderCircle className="animate-spin" /> : <Upload />}
                Replace
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Results — only shown after successful import */}
      {result.status === "success" && (
        <DeckResults activeDeck={result.activeDeck} />
      )}
    </div>
  )
}

function DeckResults({
  activeDeck,
}: {
  activeDeck: ActiveDeck
}) {
  const [selectedNoteIndex, setSelectedNoteIndex] = useState(0)
  const [deck, setDeck] = useState<ActiveDeck>(activeDeck)
  const [transformationConfigs, setTransformationConfigs] = useState<TransformationConfig[]>(
    () => DEFAULT_TRANSFORMATIONS.map((t) => ({ ...t }))
  )
  const [selectedPrompt, setSelectedPrompt] = useState<UserPrompt | null>(null)
  const [showPromptEditor, setShowPromptEditor] = useState(false)
  const [blockLayouts, setBlockLayouts] = useState<Record<string, LayoutConfig>>({})
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null)
  const summary = deck.deck
  const selectedNote = summary.sampleNotes[selectedNoteIndex] ?? null

  const noteTypeMappings = useMemo(
    () => new Map(deck.noteTypeMappings.map((m) => [m.noteTypeId, m])),
    [deck.noteTypeMappings]
  )

  const getFieldMappings = useCallback(
    (noteTypeId: string): Record<string, FieldRole> =>
      noteTypeMappings.get(noteTypeId)?.fieldMappings ?? EMPTY_FIELD_MAPPINGS,
    [noteTypeMappings]
  )

  const getTemplateSelection = useCallback(
    (noteTypeId: string): TemplateType =>
      noteTypeMappings.get(noteTypeId)?.templateSelection ?? "none",
    [noteTypeMappings]
  )

  const handleBatchResultChange = useCallback((result: BatchResult | null) => {
    setBatchResult(result)
  }, [])

  const handleBlockLayoutChange = useCallback((noteTypeId: string, layout: LayoutConfig) => {
    setBlockLayouts((prev) => ({
      ...prev,
      [noteTypeId]: layout,
    }))
  }, [])

  async function handleUpdateFieldRole(noteTypeId: string, fieldName: string, role: FieldRole) {
    const updated = updateFieldMapping(deck, noteTypeId, fieldName, role)
    setDeck(updated)
    await saveActiveDeck(updated)
  }

  async function handleUpdateTemplateSelection(noteTypeId: string, templateType: TemplateType) {
    const updated = updateTemplateSelection(deck, noteTypeId, templateType)
    setDeck(updated)
    await saveActiveDeck(updated)
  }

  function toggleTransformation(type: TransformationType) {
    setTransformationConfigs((current) =>
      current.map((config) =>
        config.type === type ? { ...config, enabled: !config.enabled } : config
      )
    )
  }

  return (
    <div className="space-y-5">

      {/* Stats overview */}
      <SectionCard label="Overview" heading="Deck stats">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <BigStat label="Notes" value={String(summary.noteCount)} />
          <BigStat label="Cards" value={String(summary.cardCount)} />
          <BigStat label="Note types" value={String(summary.noteTypeCount)} />
          <BigStat label="Media files" value={String(summary.mediaCount)} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SmallStat label="Templates" value={String(summary.templateCount)} />
          <SmallStat label="Named fields" value={String(summary.fieldCount)} />
          <SmallStat label="SQLite" value={summary.sqliteVersion} />
          <SmallStat label="Collection" value={summary.collectionFileName} />
        </div>
      </SectionCard>

      {/* Note types */}
      <SectionCard label="Schema" heading="Note types">
        <div className="space-y-3">
          {summary.noteTypes.map((noteType) => (
            <div
              key={noteType.id}
              className="rounded-[12px] border border-border bg-background/60 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[16px] font-medium text-foreground">{noteType.name}</p>
                  <p className="mt-0.5 font-mono text-[12px] text-muted-foreground">
                    ID {noteType.id}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-border bg-muted px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                  {noteType.templates.length} templates
                </span>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <FieldChipRow label="Fields" values={noteType.fieldNames} />
                <FieldChipRow
                  label="Templates"
                  values={noteType.templates.map((t) => t.name)}
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Mapping suggestions */}
      <SectionCard label="Mapping" heading="Suggested field roles">
        <div className="space-y-3">
          {summary.noteTypes.map((noteType) => (
            <MappingSuggestionCard
              key={noteType.id}
              noteType={noteType}
              suggestions={detectFieldRoles({
                noteType,
                notes: summary.sampleNotes,
              })}
              selectedRoles={getFieldMappings(noteType.id)}
              onRoleChange={(fieldName, role) =>
                handleUpdateFieldRole(noteType.id, fieldName, role)
              }
            />
          ))}
        </div>
      </SectionCard>

      {/* Template selection */}
      <SectionCard label="Template" heading="Choose a template">
        <div className="space-y-3">
          {summary.noteTypes.map((noteType) => (
            <TemplateSelectionCard
              key={noteType.id}
              noteType={noteType}
              fieldMappings={getFieldMappings(noteType.id)}
              selectedTemplate={getTemplateSelection(noteType.id)}
              onTemplateChange={(templateType) =>
                handleUpdateTemplateSelection(noteType.id, templateType)
              }
            />
          ))}
        </div>
      </SectionCard>

      {/* AI settings */}
      <SectionCard label="AI" heading="API keys">
        <AiSettings />
      </SectionCard>

      {/* Prompt library */}
      <SectionCard label="Prompts" heading="AI prompt library">
        <div className="space-y-4">
          <PromptLibrary
            activeDeck={deck}
            onSelectPrompt={setSelectedPrompt}
            selectedPromptId={selectedPrompt?.id ?? null}
          />
          <div className="border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPromptEditor((s) => !s)}
            >
              {showPromptEditor ? "Cancel" : "Create custom prompt"}
            </Button>
            {showPromptEditor && (
              <div className="mt-3">
                <PromptEditor
                  onSave={(prompt) => {
                    setSelectedPrompt(prompt)
                    setShowPromptEditor(false)
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Card browser */}
      <SectionCard label="Sample notes" heading="Card browser">
        <div className="flex items-center justify-between gap-3 pb-4">
          <p className="text-[14px] text-muted-foreground">
            Showing up to 50 sample notes parsed from this deck.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Previous note"
              disabled={selectedNoteIndex === 0}
              onClick={() => setSelectedNoteIndex(Math.max(0, selectedNoteIndex - 1))}
            >
              <ChevronLeft />
            </Button>
            <span className="min-w-12 text-center font-mono text-[12px] text-muted-foreground">
              {selectedNoteIndex + 1}/{summary.sampleNotes.length}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Next note"
              disabled={selectedNoteIndex >= summary.sampleNotes.length - 1}
              onClick={() =>
                setSelectedNoteIndex(Math.min(summary.sampleNotes.length - 1, selectedNoteIndex + 1))
              }
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
        <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
          {summary.sampleNotes.map((note, index) => {
            const noteType = summary.noteTypes.find((nt) => nt.id === note.noteTypeId)
            const isSelected = index === selectedNoteIndex
            return (
              <NoteRow
                key={note.id}
                note={note}
                noteType={noteType}
                isSelected={isSelected}
                onClick={() => setSelectedNoteIndex(index)}
              />
            )
          })}
        </div>
      </SectionCard>

      {/* Card preview */}
      {selectedNote && (
        <>
          <SectionCard label="Transform" heading="Built-in transformations">
            <div className="space-y-2">
              {transformationConfigs.map((config) => (
                <label
                  key={config.type}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-[8px] border border-border bg-background/60 px-4 py-3"
                >
                  <div>
                    <p className="text-[14px] font-medium text-foreground">
                      {config.type === "furigana" && "Furigana generation"}
                      {config.type === "htmlClean" && "HTML cleaner"}
                      {config.type === "fieldNormalize" && "Field normalizer"}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      {config.type === "furigana" && "Add ruby annotations to kanji using kuromoji.js"}
                      {config.type === "htmlClean" && "Strip font/span/style/class tags"}
                      {config.type === "fieldNormalize" && "Normalize whitespace and line endings"}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={() => toggleTransformation(config.type)}
                    className="size-4 accent-foreground"
                  />
                </label>
              ))}
            </div>
          </SectionCard>

          {/* Batch operations */}
          <SectionCard label="Batch" heading="Apply transformations">
            <BatchRunner
              activeDeck={deck}
              transformationConfigs={transformationConfigs}
              selectedPrompt={selectedPrompt}
              getFieldMappings={getFieldMappings}
              getTemplateSelection={getTemplateSelection}
              onBatchResultChange={handleBatchResultChange}
            />
          </SectionCard>

          {/* Export */}
          <SectionCard label="Export" heading="Finalize &amp; download">
            <ExportPanel
              activeDeck={deck}
              transformationConfigs={transformationConfigs}
              batchResult={batchResult}
            />
          </SectionCard>

          {/* AI transformation */}
          {selectedPrompt && (
            <AiTransformSection
              prompt={selectedPrompt}
              note={selectedNote}
              noteTypes={summary.noteTypes}
              getFieldMappings={getFieldMappings}
            />
          )}

          <CardPreviewSection
            note={selectedNote}
            noteTypes={summary.noteTypes}
            getFieldMappings={getFieldMappings}
            getTemplateSelection={getTemplateSelection}
            transformationConfigs={transformationConfigs}
            blockLayout={blockLayouts[selectedNote.noteTypeId]}
            onBlockLayoutChange={(layout) =>
              handleBlockLayoutChange(selectedNote.noteTypeId, layout)
            }
          />
        </>
      )}

      {/* Media + Schema */}
      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard label="Assets" heading="Media manifest">
          {summary.mediaSamples.length === 0 ? (
            <p className="text-[15px] text-muted-foreground">No media entries found.</p>
          ) : (
            <div className="space-y-2">
              {summary.mediaSamples.map((item) => (
                <div
                  key={`${item.archiveName}-${item.fileName}`}
                  className="flex items-center justify-between gap-3 rounded-[8px] border border-border bg-background/60 px-4 py-2.5"
                >
                  <span className="font-mono text-[12px] text-muted-foreground">
                    {item.archiveName}
                  </span>
                  <span className="truncate text-[14px] text-foreground">{item.fileName}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard label="Integrity" heading="Schema &amp; backup">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {summary.tableNames.map((name) => (
                <span
                  key={name}
                  className="rounded-[6px] border border-border bg-muted px-2 py-1 font-mono text-[12px] text-muted-foreground"
                >
                  {name}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <SmallStat label="Zip entries" value={String(summary.zipEntryCount)} />
              <SmallStat
                label="Backup size"
                value={`${Math.round(deck.fileSize / 1024)} KB`}
              />
            </div>
          </div>
        </SectionCard>
      </div>

    </div>
  )
}

/* ---------- sub-components ---------- */

function SectionCard({
  label,
  heading,
  children,
}: {
  label: string
  heading: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[20px] border border-border bg-card p-8 shadow-[0_1px_3px_rgba(26,26,26,0.03)]">
      <p className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <h3 className="mb-6 text-[20px] font-medium text-foreground">{heading}</h3>
      {children}
    </div>
  )
}

function BigStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-border bg-background/60 p-5">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-mono text-[28px] font-medium text-foreground">{value}</p>
    </div>
  )
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-border bg-background/60 px-4 py-3">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-all font-mono text-[13px] text-foreground">{value}</p>
    </div>
  )
}

function FieldChipRow({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="rounded-[6px] border border-border bg-muted px-2 py-0.5 font-mono text-[12px] text-foreground"
          >
            {v}
          </span>
        ))}
      </div>
    </div>
  )
}

function MappingSuggestionCard({
  noteType,
  suggestions,
  selectedRoles,
  onRoleChange,
}: {
  noteType: ParsedNoteType
  suggestions: FieldRoleSuggestion[]
  selectedRoles: Record<string, FieldRole>
  onRoleChange: (fieldName: string, role: FieldRole) => void
}) {
  return (
    <div className="rounded-[12px] border border-border bg-background/60 p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[16px] font-medium text-foreground">{noteType.name}</p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Heuristic only. Editable mapping comes next.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-border bg-muted px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
          {suggestions.length} fields
        </span>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {suggestions.map((suggestion) => (
          <FieldRoleRow
            key={suggestion.fieldName}
            suggestion={suggestion}
            selectedRole={selectedRoles[suggestion.fieldName] ?? suggestion.role}
            onRoleChange={(role) => onRoleChange(suggestion.fieldName, role)}
          />
        ))}
      </div>
    </div>
  )
}

function FieldRoleRow({
  suggestion,
  selectedRole,
  onRoleChange,
}: {
  suggestion: FieldRoleSuggestion
  selectedRole: FieldRole
  onRoleChange: (role: FieldRole) => void
}) {
  return (
    <div className="rounded-[8px] border border-border bg-card px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate font-mono text-[12px] text-foreground">
          {suggestion.fieldName}
        </p>
        <ConfidenceBadge confidence={suggestion.confidence} />
      </div>
      <label className="mt-2 block">
        <span className="sr-only">Role for {suggestion.fieldName}</span>
        <select
          value={selectedRole}
          onChange={(event) => onRoleChange(event.target.value as FieldRole)}
          className="w-full rounded-[8px] border border-border bg-background px-3 py-2 text-[14px] font-medium text-foreground outline-none transition-colors focus:border-foreground/40"
        >
          {fieldRoleOptions.map((role) => (
            <option key={role} value={role}>
              {getFieldRoleLabel(role)}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">
        Suggested: {getFieldRoleLabel(suggestion.role)} ·{" "}
        {suggestion.reasons.join("; ")}
      </p>
    </div>
  )
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percent = Math.round(confidence * 100)
  const label = confidence >= 0.75 ? "high" : confidence >= 0.5 ? "medium" : "low"

  return (
    <span
      className="rounded-[6px] border border-border bg-muted px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground"
      title={`${percent}% confidence`}
    >
      {label} · {percent}%
    </span>
  )
}

function NoteRow({
  note,
  noteType,
  isSelected,
  onClick,
}: {
  note: ParsedNote
  noteType: ParsedNoteType | undefined
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      className="w-full rounded-[12px] border border-border bg-background/60 p-5 text-left transition-colors hover:bg-muted/50 data-[selected=true]:border-foreground/20 data-[selected=true]:bg-muted"
      data-selected={isSelected}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] font-medium text-foreground">
          {noteType?.name ?? "Unknown note type"}
        </p>
        <span className="shrink-0 font-mono text-[12px] text-muted-foreground">
          #{note.id}
        </span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {note.fieldValues.slice(0, 4).map((value, i) => (
          <div key={`${note.id}-${i}`} className="rounded-[8px] border border-border bg-muted/40 px-3 py-2">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              {noteType?.fieldNames[i] ?? `Field ${i + 1}`}
            </p>
            <p className="mt-1 line-clamp-2 text-[13px] text-foreground">{value || "(empty)"}</p>
          </div>
        ))}
      </div>
    </button>
  )
}

function AiTransformSection({
  prompt,
  note,
  noteTypes,
  getFieldMappings,
}: {
  prompt: UserPrompt
  note: ParsedNote
  noteTypes: ParsedNoteType[]
  getFieldMappings: (noteTypeId: string) => Record<string, FieldRole>
}) {
  const [result, setResult] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState("")

  const noteType = noteTypes.find((nt) => nt.id === note.noteTypeId)
  const fieldMappings = noteType ? getFieldMappings(noteType.id) : {}

  const roleToFieldName: Record<string, string> = {}
  for (const [fieldName, role] of Object.entries(fieldMappings)) {
    roleToFieldName[role] = fieldName
  }

  const variableValues: Record<string, string> = {}
  for (const variable of prompt.variables) {
    const fieldName = roleToFieldName[variable.role]
    if (fieldName && noteType) {
      const index = noteType.fieldNames.indexOf(fieldName)
      if (index >= 0) {
        variableValues[variable.name] = note.fieldValues[index] ?? ""
      }
    }
  }

  const interpolatedSystem = interpolatePrompt(prompt.systemMessage, variableValues)
  const interpolatedUser = interpolatePrompt(prompt.userMessage, variableValues)
  const tokenEstimate = estimateTokens(interpolatedSystem + interpolatedUser)
  const costEstimate = estimateCost(tokenEstimate, "gpt-4o-mini")

  async function handleRun() {
    setIsRunning(true)
    setError("")
    setResult("")

    try {
      const key = await getActiveApiKey()
      if (!key) {
        setError("No API key saved. Add one in the AI settings above.")
        return
      }

      const messages: AiMessage[] = []
      if (interpolatedSystem) {
        messages.push({ role: "system", content: interpolatedSystem })
      }
      messages.push({ role: "user", content: interpolatedUser })

      const response = await sendAiRequest({
        provider: key.provider,
        messages,
        config: {
          endpoint: key.endpoint,
          apiKey: key.apiKey,
          model: key.model,
        },
      })

      setResult(sanitizeAiOutput(response))
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI request failed")
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <SectionCard label="AI" heading={`Run: ${prompt.name}`}>
      <div className="space-y-3">
        <div className="rounded-[8px] border border-border bg-background/60 px-4 py-3">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Interpolated prompt
          </p>
          <p className="mt-1 whitespace-pre-wrap text-[13px] text-foreground">
            {interpolatedUser || "(no variables matched)"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={handleRun}
            disabled={isRunning}
          >
            {isRunning ? <LoaderCircle className="animate-spin" /> : <Play />}
            {isRunning ? "Running..." : "Run on sample"}
          </Button>
          <span className="font-mono text-[11px] text-muted-foreground">
            ~{tokenEstimate} tokens · ~${costEstimate.toFixed(4)}
          </span>
        </div>

        {error && (
          <p className="rounded-[8px] bg-[rgba(217,58,38,0.10)] px-4 py-3 text-[13px] text-[#A8321A]">
            {error}
          </p>
        )}

        {result && (
          <div className="rounded-[8px] border border-border bg-background/60 px-4 py-3">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Result
            </p>
            <p className="mt-1 whitespace-pre-wrap text-[13px] text-foreground">
              {result}
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  )
}

function CardPreviewSection({
  note,
  noteTypes,
  getFieldMappings,
  getTemplateSelection,
  transformationConfigs,
  blockLayout,
  onBlockLayoutChange,
}: {
  note: ParsedNote
  noteTypes: ParsedNoteType[]
  getFieldMappings: (noteTypeId: string) => Record<string, FieldRole>
  getTemplateSelection: (noteTypeId: string) => TemplateType
  transformationConfigs: TransformationConfig[]
  blockLayout?: LayoutConfig
  onBlockLayoutChange?: (layout: LayoutConfig) => void
}) {
  const noteType = noteTypes.find((c) => c.id === note.noteTypeId)
  const template = noteType ? getFirstRenderableTemplate(noteType) : null

  if (!noteType || !template) {
    return (
      <SectionCard label="Render" heading="Card preview">
        <p className="text-[15px] text-muted-foreground">
          This note has no renderable card template.
        </p>
      </SectionCard>
    )
  }

  return (
    <CardPreviewContent
      note={note}
      noteType={noteType}
      template={template}
      fieldMappings={getFieldMappings(note.noteTypeId)}
      templateType={getTemplateSelection(note.noteTypeId)}
      transformationConfigs={transformationConfigs}
      blockLayout={blockLayout}
      onBlockLayoutChange={onBlockLayoutChange}
    />
  )
}

function CardPreviewContent({
  note,
  noteType,
  template,
  fieldMappings,
  templateType,
  transformationConfigs,
  blockLayout,
  onBlockLayoutChange,
}: {
  note: ParsedNote
  noteType: ParsedNoteType
  template: { name: string; front: string; back: string }
  fieldMappings: Record<string, FieldRole>
  templateType: TemplateType
  transformationConfigs: TransformationConfig[]
  blockLayout?: LayoutConfig
  onBlockLayoutChange?: (layout: LayoutConfig) => void
}) {
  const [preview, setPreview] = useState<{
    transformedFrontHtml: string
    transformedBackHtml: string
    fieldDiffs: { name: string; before: string; after: string; moved?: boolean }[]
    isLoading: boolean
  }>({
    transformedFrontHtml: "",
    transformedBackHtml: "",
    fieldDiffs: [],
    isLoading: true,
  })

  useEffect(() => {
    let cancelled = false

    async function computePreview() {
      setPreview((p) => ({ ...p, isLoading: true }))

      const transformed = applyTemplateTransform({
        note,
        noteType,
        fieldMappings,
        templateType,
      })

      const transformedNote = transformed.note

      for (let i = 0; i < noteType.fieldNames.length; i++) {
        const fieldName = noteType.fieldNames[i]
        const role = fieldMappings[fieldName] ?? "unknown"
        const originalValue = note.fieldValues[i] ?? ""
        const transformedIndex = transformed.fieldOrder.indexOf(fieldName)
        if (transformedIndex >= 0) {
          const result = await applyTransformations({
            value: originalValue,
            role,
            configs: transformationConfigs,
          })
          transformedNote.fieldValues[transformedIndex] = result.value
        }
      }

      const fieldDiffs = computeTemplateDiffs({
        originalNote: note,
        transformedNote,
        originalNoteType: noteType,
        transformedFieldOrder: transformed.fieldOrder,
      })

      const transformedFrontHtml = blockLayout
        ? generatePreviewWithBlocks({
            note: transformedNote,
            noteType,
            fieldMappings,
            layout: blockLayout,
            face: "front",
          }).html
        : templateType === "none"
          ? renderAnkiTemplate({
              template: template.front,
              note: transformedNote,
              noteType,
            })
          : renderTemplatePreviewHtml({
              note: transformedNote,
              noteType,
              fieldMappings,
              templateType,
              face: "front",
            })

      const transformedBackHtml = blockLayout
        ? generatePreviewWithBlocks({
            note: transformedNote,
            noteType,
            fieldMappings,
            layout: blockLayout,
            face: "back",
          }).html
        : templateType === "none"
          ? renderAnkiTemplate({
              template: template.back,
              note: transformedNote,
              noteType,
            })
          : renderTemplatePreviewHtml({
              note: transformedNote,
              noteType,
              fieldMappings,
              templateType,
              face: "back",
            })

      if (!cancelled) {
        setPreview({
          transformedFrontHtml,
          transformedBackHtml,
          fieldDiffs,
          isLoading: false,
        })
      }
    }

    computePreview()

    return () => {
      cancelled = true
    }
  }, [note, noteType, template, fieldMappings, templateType, transformationConfigs, blockLayout])

  const frontHtml = renderAnkiTemplate({ template: template.front, note, noteType })
  const backHtml = renderAnkiTemplate({ template: template.back, note, noteType })
  const blockStyles = blockLayout
    ? generatePreviewWithBlocks({ note, noteType, fieldMappings, layout: blockLayout, face: "front" }).styles
    : ""
  const extraStyles = blockLayout
    ? blockStyles
    : templateType !== "none"
      ? getTemplatePreviewStyles()
      : ""

  return (
    <SectionCard label="Preview" heading="Original vs transformed">
      {onBlockLayoutChange && (
        <div className="mb-4">
          <BlockEditor
            availableRoles={Object.values(fieldMappings).filter((r): r is FieldRole => r !== "unknown")}
            initialLayout={blockLayout}
            onLayoutChange={onBlockLayoutChange}
          />
        </div>
      )}
      <div className="mb-4 flex items-center gap-2">
        <span className="font-mono text-[12px] text-muted-foreground">{noteType.name}</span>
        <span className="text-muted-foreground">·</span>
        <span className="font-mono text-[12px] text-muted-foreground">{template.name}</span>
        {templateType !== "none" && (
          <>
            <span className="text-muted-foreground">·</span>
            <span className="rounded-[6px] border border-border bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
              {templateType} template
            </span>
          </>
        )}
        <span className="ml-auto rounded-[6px] border border-border bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
          sandboxed iframe
        </span>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <PreviewPane
          title="Original"
          frontHtml={frontHtml}
          backHtml={backHtml}
          changed={false}
        />
        <PreviewPane
          title="Transformed preview"
          frontHtml={preview.transformedFrontHtml}
          backHtml={preview.transformedBackHtml}
          changed={preview.fieldDiffs.length > 0}
          extraStyles={extraStyles}
          isLoading={preview.isLoading}
        />
      </div>
      <FieldDiffPanel diffs={preview.fieldDiffs} />
    </SectionCard>
  )
}

/* ---------- template selection components ---------- */

function TemplateSelectionCard({
  noteType,
  fieldMappings,
  selectedTemplate,
  onTemplateChange,
}: {
  noteType: ParsedNoteType
  fieldMappings: Record<string, FieldRole>
  selectedTemplate: TemplateType
  onTemplateChange: (templateType: TemplateType) => void
}) {
  const match = getBestTemplateMatch(fieldMappings)
  const isSuggested = match?.template.id === selectedTemplate && match.score >= 0.5

  return (
    <div className="rounded-[12px] border border-border bg-background/60 p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[16px] font-medium text-foreground">{noteType.name}</p>
          {match && match.score >= 0.5 && (
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Suggested: {match.template.name} ({Math.round(match.score * 100)}% match)
            </p>
          )}
        </div>
        <span className="shrink-0 rounded-full border border-border bg-muted px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
          {noteType.fieldNames.length} fields
        </span>
      </div>

      <label className="block">
        <span className="sr-only">Template for {noteType.name}</span>
        <select
          value={selectedTemplate}
          onChange={(event) => onTemplateChange(event.target.value as TemplateType)}
          className="w-full rounded-[8px] border border-border bg-background px-3 py-2 text-[14px] font-medium text-foreground outline-none transition-colors focus:border-foreground/40"
        >
          {TEMPLATE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "none" ? "None (keep original)" : `${option.charAt(0).toUpperCase() + option.slice(1)}`}
            </option>
          ))}
        </select>
      </label>

      {selectedTemplate !== "none" && (
        <TemplateFieldChecklist
          templateId={selectedTemplate}
          fieldMappings={fieldMappings}
        />
      )}

      {isSuggested && (
        <p className="mt-2 text-[12px] text-muted-foreground">
          This template was auto-selected based on detected field roles.
        </p>
      )}
    </div>
  )
}

function TemplateFieldChecklist({
  templateId,
  fieldMappings,
}: {
  templateId: Exclude<TemplateType, "none">
  fieldMappings: Record<string, FieldRole>
}) {
  const template = TEMPLATES[templateId]
  const presentRoles = new Set(Object.values(fieldMappings))

  return (
    <div className="mt-3 space-y-2">
      {template.requiredRoles.length > 0 && (
        <div>
          <p className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Required
          </p>
          <div className="flex flex-wrap gap-1.5">
            {template.requiredRoles.map((role) => {
              const present = presentRoles.has(role)
              return (
                <span
                  key={role}
                  className={`rounded-[6px] px-2 py-0.5 font-mono text-[11px] ${
                    present
                      ? "bg-[rgba(74,122,78,0.12)] text-[#2E5C33]"
                      : "bg-[rgba(217,58,38,0.10)] text-[#A8321A]"
                  }`}
                >
                  {present ? "✓" : "✗"} {getFieldRoleLabel(role)}
                </span>
              )
            })}
          </div>
        </div>
      )}
      {template.optionalRoles.length > 0 && (
        <div>
          <p className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Optional
          </p>
          <div className="flex flex-wrap gap-1.5">
            {template.optionalRoles.map((role) => {
              const present = presentRoles.has(role)
              return (
                <span
                  key={role}
                  className={`rounded-[6px] px-2 py-0.5 font-mono text-[11px] ${
                    present
                      ? "bg-[rgba(74,122,78,0.12)] text-[#2E5C33]"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {present ? "✓" : "−"} {getFieldRoleLabel(role)}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- diff components ---------- */

function PreviewPane({
  title,
  frontHtml,
  backHtml,
  changed,
  extraStyles = "",
  isLoading = false,
}: {
  title: string
  frontHtml: string
  backHtml: string
  changed: boolean
  extraStyles?: string
  isLoading?: boolean
}) {
  return (
    <div className="rounded-[12px] border border-border bg-background/60 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[15px] font-medium text-foreground">{title}</p>
        <span
          className="rounded-[6px] border border-border bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
          data-changed={changed}
        >
          {isLoading ? "computing…" : changed ? "changed" : "unchanged"}
        </span>
      </div>
      <div className="grid gap-3">
        <PreviewFrame
          title="Front"
          html={createPreviewDocument({ title: `${title} front`, body: frontHtml, extraStyles })}
          isLoading={isLoading}
        />
        <PreviewFrame
          title="Back"
          html={createPreviewDocument({ title: `${title} back`, body: backHtml, extraStyles })}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}

function FieldDiffPanel({ diffs }: { diffs: FieldDiff[] }) {
  return (
    <div className="mt-4 rounded-[12px] border border-border bg-background/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[15px] font-medium text-foreground">Diff summary</p>
        <span className="rounded-[6px] border border-border bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
          {diffs.length} fields
        </span>
      </div>
      {diffs.length === 0 ? (
        <p className="mt-3 text-[14px] text-muted-foreground">
          No field changes in the current preview transform.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {diffs.map((diff) => (
            <div key={diff.name} className="rounded-[8px] border border-border bg-card p-3">
              <div className="flex items-center gap-2">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  {diff.name}
                </p>
                {diff.moved && (
                  <span className="rounded-[999px] bg-[rgba(184,135,58,0.12)] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] text-[#8A6528]">
                    reordered
                  </span>
                )}
              </div>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <DiffValue label="Before" value={diff.before} tone="before" />
                <DiffValue label="After" value={diff.after} tone="after" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DiffValue({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "before" | "after"
}) {
  return (
    <div
      className="rounded-[6px] border px-3 py-2"
      data-tone={tone}
    >
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-[13px] text-foreground">
        {value || "(empty)"}
      </p>
    </div>
  )
}

function PreviewFrame({
  title,
  html,
  isLoading = false,
}: {
  title: string
  html: string
  isLoading?: boolean
}) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-border bg-background">
      <div className="border-b border-border px-4 py-2 font-mono text-[12px] font-medium text-muted-foreground">
        {title}
      </div>
      {isLoading ? (
        <div className="flex h-64 items-center justify-center bg-background">
          <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <iframe
          title={`${title} card preview`}
          sandbox=""
          srcDoc={html}
          className="h-64 w-full bg-background"
        />
      )}
    </div>
  )
}
