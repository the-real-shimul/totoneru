"use client"

import { ChevronDown, ChevronLeft, ChevronRight, LoaderCircle, Upload, X } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { saveOriginalDeckBackup, saveActiveDeck, loadMostRecentActiveDeck, deleteActiveDeck, deleteBackup, deleteAllStaleDeckRecords } from "@/lib/deck-storage"
import {
  createPreviewDocument,
  getFirstRenderableTemplate,
  renderAnkiTemplate,
} from "@/lib/anki-template-renderer"
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
const INPUT_ID = "apkg-import-input"

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
      <input
        ref={inputRef}
        id={INPUT_ID}
        type="file"
        accept=".apkg,application/octet-stream"
        className="sr-only"
        onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
      />

      {result.status !== "success" && (
        <div className="border-2 border-black bg-white p-10">
          {result.status === "loading" && (
            <div className="flex items-center gap-3 py-6 text-muted-foreground">
              <LoaderCircle className="animate-spin size-5" />
              <span className="text-[14px]">Restoring workspace…</span>
            </div>
          )}

          {result.status === "idle" && (
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="text-[20px] font-medium text-[#1a1a1a]">Choose a deck to import</p>
                <p className="text-[15px] leading-[1.55] text-[#4A4744]">
                  Reads notes, note types, templates, and media manifest entirely in the browser.
                  Nothing is uploaded.
                </p>
              </div>
              <Button
                type="button"
                size="lg"
                className="shrink-0"
                onClick={() => document.getElementById(INPUT_ID)?.click()}
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
                <p className="text-[15px] font-medium text-[#A8321A]">Import failed</p>
                <p className="text-[15px] leading-[1.55] text-[#4A4744]">{result.message}</p>
              </div>
              <Button
                type="button"
                size="lg"
                className="shrink-0"
                onClick={() => {
                  setResult({ status: "idle" })
                  document.getElementById(INPUT_ID)?.click()
                }}
              >
                <Upload />
                Try again
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Results — only shown after successful import */}
      {result.status === "success" && (
        <DeckResults
          key={result.activeDeck.id}
          activeDeck={result.activeDeck}
          isReplacing={isPending}
          onClearWorkspace={handleClearWorkspace}
          onReplaceDeck={() => document.getElementById(INPUT_ID)?.click()}
        />
      )}
    </div>
  )
}

function DeckResults({
  activeDeck,
  isReplacing,
  onClearWorkspace,
  onReplaceDeck,
}: {
  activeDeck: ActiveDeck
  isReplacing: boolean
  onClearWorkspace: () => void
  onReplaceDeck: () => void
}) {
  const [selectedNoteIndex, setSelectedNoteIndex] = useState(0)
  const [deck, setDeck] = useState<ActiveDeck>(activeDeck)
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

  return (
    <div className="space-y-5">
      <ImportReadyPanel
        deck={deck}
        fieldMappings={getFieldMappings(summary.noteTypes[0]?.id ?? "")}
        templateSelection={getTemplateSelection(summary.noteTypes[0]?.id ?? "")}
        isReplacing={isReplacing}
        onClearWorkspace={onClearWorkspace}
        onReplaceDeck={onReplaceDeck}
      />

      <AdvancedDeckReview hasMedia={summary.mediaSamples.length > 0}>
        {/* Mapping suggestions */}
        <SectionCard label="Mapping" heading="Field roles" initialOpen={false}>
          <div className="mb-4 border-2 border-black bg-[#f5f5f5] p-4 text-[14px] leading-[1.45] text-[#4A4744]">
            Totoneru guesses which Anki fields are the word, reading, meaning, and example sentence.
            Change these only if previews look wrong.
          </div>
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
        <SectionCard label="Layout" heading="Card layout" initialOpen={false}>
          <div className="mb-4 border-2 border-black bg-[#f5f5f5] p-4 text-[14px] leading-[1.45] text-[#4A4744]">
            This controls how exported cards are arranged. Leave the suggested layout unless you
            know you want a different card shape.
          </div>
          <div className="space-y-3">
            {summary.noteTypes.map((noteType) => (
              <TemplateSelectionCard
                key={noteType.id}
                noteType={noteType}
                fieldMappings={getFieldMappings(noteType.id)}
                selectedTemplate={getTemplateSelection(noteType.id)}
                sampleNote={
                  selectedNote?.noteTypeId === noteType.id
                    ? selectedNote
                    : summary.sampleNotes.find((note) => note.noteTypeId === noteType.id) ?? null
                }
                onTemplateChange={(templateType) =>
                  handleUpdateTemplateSelection(noteType.id, templateType)
                }
              />
            ))}
          </div>
        </SectionCard>

        {/* Card browser */}
        <SectionCard label="Samples" heading="Sample cards" initialOpen={false}>
          <div className="flex items-center justify-between gap-3 pb-4">
            <p className="text-[14px] text-[#757575]">
              A small sample from the imported deck for checking parsed fields and previews.
            </p>
            <div className="flex shrink-0 items-center gap-2">
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
              <span className="min-w-12 text-center font-mono text-[12px] text-[#757575]">
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
          <SampleCardsPanel
            notes={summary.sampleNotes}
            noteTypes={summary.noteTypes}
            selectedIndex={selectedNoteIndex}
            onSelect={setSelectedNoteIndex}
          />
        </SectionCard>

        {summary.mediaSamples.length > 0 && (
          <SectionCard label="Assets" heading="Media files" initialOpen={false}>
            <div className="space-y-2">
              {summary.mediaSamples.map((item) => (
                <div
                  key={`${item.archiveName}-${item.fileName}`}
                  className="flex items-center justify-between gap-3 border-2 border-black bg-white px-4 py-2.5"
                >
                  <span className="font-mono text-[12px] text-[#757575]">
                    {item.archiveName}
                  </span>
                  <span className="truncate text-[14px] text-[#1a1a1a]">{item.fileName}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </AdvancedDeckReview>

    </div>
  )
}

/* ---------- sub-components ---------- */

function ImportReadyPanel({
  deck,
  fieldMappings,
  templateSelection,
  isReplacing,
  onClearWorkspace,
  onReplaceDeck,
}: {
  deck: ActiveDeck
  fieldMappings: Record<string, FieldRole>
  templateSelection: TemplateType
  isReplacing: boolean
  onClearWorkspace: () => void
  onReplaceDeck: () => void
}) {
  const summary = deck.deck
  const mappedRoles = new Set(Object.values(fieldMappings).filter((role) => role !== "unknown"))

  return (
    <section className="border-2 border-black bg-white p-6 sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#757575]">
            Current deck
          </p>
          <h3 className="mt-1 text-[30px] font-black leading-none tracking-[-0.02em]">
            {deck.fileName}
          </h3>
          <p className="mt-3 max-w-2xl text-[15px] leading-[1.5] text-[#4A4744]">
            Imported safely with an original backup saved in your browser. Totoneru detected a
            usable card structure, so the next step is editing or previewing changes.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/ai"
              className="inline-flex min-h-11 items-center justify-center border-2 border-black bg-black px-4 py-2 text-[14px] font-bold text-white transition-colors hover:bg-white hover:text-black"
            >
              Continue to AI
            </Link>
            <Link
              href="/batch"
              className="inline-flex min-h-11 items-center justify-center border-2 border-black bg-white px-4 py-2 text-[14px] font-bold text-black transition-colors hover:bg-black hover:text-white"
            >
              Preview batch changes
            </Link>
            <Button
              type="button"
              variant="outline"
              onClick={onReplaceDeck}
              disabled={isReplacing}
            >
              {isReplacing ? <LoaderCircle className="animate-spin" /> : <Upload />}
              Replace deck
            </Button>
            <Button type="button" variant="outline" onClick={onClearWorkspace}>
              <X />
              Clear
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryStat label="Notes" value={String(summary.noteCount)} />
          <SummaryStat label="Cards" value={String(summary.cardCount)} />
          <SummaryStat label="Fields mapped" value={`${mappedRoles.size}/${summary.fieldCount}`} />
          <SummaryStat label="Layout" value={getTemplateDisplayName(templateSelection)} />
        </div>
      </div>
      <div className="mt-6 grid gap-3 border-t-2 border-black pt-4 sm:grid-cols-3">
        <CheckLine label="Original backup saved" />
        <CheckLine label={`${Math.round(deck.fileSize / 1024)} KB local file`} />
        <CheckLine label={`${summary.collectionFileName} supported`} />
      </div>
    </section>
  )
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-black bg-[#f5f5f5] p-4">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#757575]">
        {label}
      </p>
      <p className="mt-1 break-words text-[20px] font-black leading-none text-[#1a1a1a]">{value}</p>
    </div>
  )
}

function CheckLine({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#1a1a1a]">
      <span className="flex size-5 items-center justify-center border-2 border-black bg-black text-[12px] leading-none text-white">
        ✓
      </span>
      {label}
    </div>
  )
}

function AdvancedDeckReview({
  children,
  hasMedia,
}: {
  children: React.ReactNode
  hasMedia: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 border-2 border-black bg-white p-6 text-left transition-colors hover:bg-[#f5f5f5]"
        aria-expanded={open}
      >
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#757575]">
            Optional
          </p>
          <h3 className="mt-1 text-[24px] font-black leading-none">Advanced deck review</h3>
          <p className="mt-2 max-w-2xl text-[14px] leading-[1.45] text-[#757575]">
            {hasMedia
              ? "Field mapping, layout choice, sample cards, and media files."
              : "Field mapping, layout choice, and sample cards."}
          </p>
        </div>
        <ChevronDown
          className="size-5 shrink-0 transition-transform"
          style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
          aria-hidden="true"
        />
      </button>
      {open && <div className="mt-5 space-y-5">{children}</div>}
    </section>
  )
}

function SectionCard({
  label,
  heading,
  children,
  initialOpen = true,
}: {
  label: string
  heading: string
  children: React.ReactNode
  initialOpen?: boolean
}) {
  const [open, setOpen] = useState(initialOpen)

  return (
    <div className="border-2 border-black bg-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 p-8 text-left"
        aria-expanded={open}
      >
        <div>
          <p className="mb-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#757575]">
            {label}
          </p>
          <h3 className="text-[20px] font-medium text-[#1a1a1a]">{heading}</h3>
        </div>
        <ChevronDown
          className="size-5 shrink-0 transition-transform"
          style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
          aria-hidden="true"
        />
      </button>
      {open && <div className="px-8 pb-8">{children}</div>}
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
    <div className=" border-2 border-black bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[16px] font-medium text-[#1a1a1a]">{noteType.name}</p>
          <p className="mt-0.5 text-[13px] text-[#757575]">
            Heuristic only. Editable mapping comes next.
          </p>
        </div>
        <span className="shrink-0 border-2 border-black bg-[#f5f5f5] px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#757575]">
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
    <div className=" border-2 border-black bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate font-mono text-[12px] text-[#1a1a1a]">
          {suggestion.fieldName}
        </p>
        <ConfidenceBadge confidence={suggestion.confidence} />
      </div>
      <label className="mt-2 block">
        <span className="sr-only">Role for {suggestion.fieldName}</span>
        <select
          value={selectedRole}
          onChange={(event) => onRoleChange(event.target.value as FieldRole)}
          className="w-full border-2 border-black bg-white px-3 py-2 text-[14px] font-medium text-[#1a1a1a] outline-none transition-colors focus:border-black/40"
        >
          {fieldRoleOptions.map((role) => (
            <option key={role} value={role}>
              {getFieldRoleLabel(role)}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-1 line-clamp-2 text-[12px] text-[#757575]">
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
      className=" border-2 border-black bg-[#f5f5f5] px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#757575]"
      title={`${percent}% confidence`}
    >
      {label} · {percent}%
    </span>
  )
}

function SampleCardsPanel({
  notes,
  noteTypes,
  selectedIndex,
  onSelect,
}: {
  notes: ParsedNote[]
  noteTypes: ParsedNoteType[]
  selectedIndex: number
  onSelect: (index: number) => void
}) {
  const selectedNote = notes[selectedIndex] ?? null
  const selectedNoteType = selectedNote
    ? noteTypes.find((noteType) => noteType.id === selectedNote.noteTypeId)
    : undefined

  if (!selectedNote) {
    return <p className="text-[15px] text-[#757575]">No sample cards were found in this deck.</p>
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem]">
      <AnkiCardPreview note={selectedNote} noteType={selectedNoteType} />
      <div className="border-2 border-black bg-[#f5f5f5] p-3">
        <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#757575]">
          Samples
        </p>
        <div className="max-h-[20rem] space-y-2 overflow-y-auto pr-1">
          {notes.map((note, index) => {
            const noteType = noteTypes.find((candidate) => candidate.id === note.noteTypeId)
            const isSelected = index === selectedIndex

            return (
              <button
                key={note.id}
                type="button"
                aria-pressed={isSelected}
                className="w-full border-2 border-black bg-white px-3 py-2 text-left text-[13px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f5f5f5] data-[selected=true]:bg-black data-[selected=true]:text-white"
                data-selected={isSelected}
                onClick={() => onSelect(index)}
              >
                <span className="block truncate">{getSampleCardLabel(note, noteType, index)}</span>
                <span className="mt-0.5 block truncate font-mono text-[11px] opacity-70">
                  {noteType?.name ?? "Unknown note type"}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function AnkiCardPreview({
  note,
  noteType,
}: {
  note: ParsedNote
  noteType: ParsedNoteType | undefined
}) {
  if (!noteType) {
    return (
      <div className="border-2 border-black bg-white p-5 text-[15px] text-[#757575]">
        This sample uses a note type that was not found.
      </div>
    )
  }

  const template = getFirstRenderableTemplate(noteType)

  if (!template) {
    return (
      <div className="border-2 border-black bg-white p-5 text-[15px] text-[#757575]">
        This note type does not include an Anki card template.
      </div>
    )
  }

  const front = renderAnkiTemplate({
    template: template.front,
    note,
    noteType,
  })
  const back = renderAnkiTemplate({
    template: template.back,
    note,
    noteType,
    frontSide: front,
  })
  const styles = noteType.css ?? ""

  return (
    <div className="border-2 border-black bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-medium text-[#1a1a1a]">{template.name}</p>
          <p className="mt-0.5 text-[12px] text-[#757575]">
            Rendered from the imported Anki front and back templates.
          </p>
        </div>
        <span className="shrink-0 font-mono text-[12px] text-[#757575]">#{note.id}</span>
      </div>
      <PreviewFaceGrid
        frontHtml={createPreviewDocument({
          body: front,
          title: `${noteType.name} front`,
          extraStyles: styles,
        })}
        backHtml={createPreviewDocument({
          body: back,
          title: `${noteType.name} back`,
          extraStyles: styles,
        })}
      />
    </div>
  )
}

function PreviewFaceGrid({
  frontHtml,
  backHtml,
}: {
  frontHtml: string
  backHtml: string
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <PreviewFrame label="Front" html={frontHtml} />
      <PreviewFrame label="Back" html={backHtml} />
    </div>
  )
}

function PreviewFrame({ label, html }: { label: string; html: string }) {
  return (
    <div className="border-2 border-black bg-[#f5f5f5]">
      <div className="border-b-2 border-black px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#757575]">
        {label}
      </div>
      <iframe
        title={`${label} Anki card preview`}
        srcDoc={html}
        sandbox="allow-scripts"
        className="h-64 w-full bg-white"
      />
    </div>
  )
}

function getSampleCardLabel(
  note: ParsedNote,
  noteType: ParsedNoteType | undefined,
  index: number
) {
  const firstValue = note.fieldValues.find((value) => value.trim().length > 0)
  return firstValue ?? noteType?.name ?? `Sample ${index + 1}`
}

function LayoutPreview({
  noteType,
  fieldMappings,
  selectedTemplate,
  sampleNote,
}: {
  noteType: ParsedNoteType
  fieldMappings: Record<string, FieldRole>
  selectedTemplate: TemplateType
  sampleNote: ParsedNote | null
}) {
  if (!sampleNote) {
    return (
      <div className="mt-4 border-t-2 border-black pt-4 text-[14px] text-[#757575]">
        No sample note is available for this note type.
      </div>
    )
  }

  const originalTemplate = getFirstRenderableTemplate(noteType)
  const front =
    selectedTemplate === "none" && originalTemplate
      ? renderAnkiTemplate({
          template: originalTemplate.front,
          note: sampleNote,
          noteType,
        })
      : renderTemplatePreviewHtml({
          note: sampleNote,
          noteType,
          fieldMappings,
          templateType: selectedTemplate,
          face: "front",
        })
  const back =
    selectedTemplate === "none" && originalTemplate
      ? renderAnkiTemplate({
          template: originalTemplate.back,
          note: sampleNote,
          noteType,
          frontSide: front,
        })
      : renderTemplatePreviewHtml({
          note: sampleNote,
          noteType,
          fieldMappings,
          templateType: selectedTemplate,
          face: "back",
        })
  const styles =
    selectedTemplate === "none" ? noteType.css ?? "" : getTemplatePreviewStyles(selectedTemplate)

  return (
    <div className="mt-4 border-t-2 border-black pt-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[14px] font-medium text-[#1a1a1a]">Anki preview</p>
          <p className="mt-0.5 text-[12px] text-[#757575]">
            {selectedTemplate === "none"
              ? "Original card template from the imported deck."
              : "Preview of the selected export layout using this deck's sample data."}
          </p>
        </div>
      </div>
      <PreviewFaceGrid
        frontHtml={createPreviewDocument({
          body: front,
          title: `${noteType.name} layout front`,
          extraStyles: styles,
        })}
        backHtml={createPreviewDocument({
          body: back,
          title: `${noteType.name} layout back`,
          extraStyles: styles,
        })}
      />
    </div>
  )
}

/* ---------- template selection components ---------- */

function TemplateSelectionCard({
  noteType,
  fieldMappings,
  selectedTemplate,
  sampleNote,
  onTemplateChange,
}: {
  noteType: ParsedNoteType
  fieldMappings: Record<string, FieldRole>
  selectedTemplate: TemplateType
  sampleNote: ParsedNote | null
  onTemplateChange: (templateType: TemplateType) => void
}) {
  const match = getBestTemplateMatch(fieldMappings)
  const isSuggested = match?.template.id === selectedTemplate && match.score >= 0.5

  return (
    <div className=" border-2 border-black bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[16px] font-medium text-[#1a1a1a]">{noteType.name}</p>
          {match && match.score >= 0.5 && (
            <p className="mt-0.5 text-[13px] text-[#757575]">
              Suggested: {match.template.name} ({Math.round(match.score * 100)}% match)
            </p>
          )}
        </div>
        <span className="shrink-0 border-2 border-black bg-[#f5f5f5] px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#757575]">
          {noteType.fieldNames.length} fields
        </span>
      </div>

      <label className="block">
        <span className="sr-only">Template for {noteType.name}</span>
        <select
          value={selectedTemplate}
          onChange={(event) => onTemplateChange(event.target.value as TemplateType)}
          className="w-full border-2 border-black bg-white px-3 py-2 text-[14px] font-medium text-[#1a1a1a] outline-none transition-colors focus:border-black/40"
        >
          {TEMPLATE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {getTemplateDisplayName(option)}
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
        <p className="mt-2 text-[12px] text-[#757575]">
          This template was auto-selected based on detected field roles.
        </p>
      )}

      <LayoutPreview
        noteType={noteType}
        fieldMappings={fieldMappings}
        selectedTemplate={selectedTemplate}
        sampleNote={sampleNote}
      />
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
          <p className="mb-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#757575]">
            Required
          </p>
          <div className="flex flex-wrap gap-1.5">
            {template.requiredRoles.map((role) => {
              const present = presentRoles.has(role)
              return (
                <span
                  key={role}
                  className={` px-2 py-0.5 font-mono text-[11px] ${
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
          <p className="mb-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#757575]">
            Optional
          </p>
          <div className="flex flex-wrap gap-1.5">
            {template.optionalRoles.map((role) => {
              const present = presentRoles.has(role)
              return (
                <span
                  key={role}
                  className={` px-2 py-0.5 font-mono text-[11px] ${
                    present
                      ? "bg-[rgba(74,122,78,0.12)] text-[#2E5C33]"
                      : "bg-[#f5f5f5] text-[#757575]"
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

function getTemplateDisplayName(templateType: TemplateType) {
  switch (templateType) {
    case "expressionFocused":
      return "Japanese vocab layout"
    case "vocabulary":
      return "Word card"
    case "sentence":
      return "Sentence card"
    case "none":
      return "Keep original layout"
  }
}
