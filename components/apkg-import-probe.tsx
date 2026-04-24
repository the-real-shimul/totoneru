"use client"

import { ChevronLeft, ChevronRight, LoaderCircle, Upload } from "lucide-react"
import { useId, useRef, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import {
  createPreviewDocument,
  getFirstRenderableTemplate,
  renderAnkiTemplate,
} from "@/lib/anki-template-renderer"
import { saveOriginalDeckBackup } from "@/lib/deck-backups"
import type {
  ApkgParserRequest,
  ApkgParserResponse,
  ParsedDeckSummary,
  ParsedNote,
  ParsedNoteType,
} from "@/lib/apkg-parser-types"

type BackupSummary = {
  id: string
  fileName: string
  fileSize: number
  createdAt: string
}

type ProbeState =
  | { status: "idle" }
  | { status: "success"; deck: ParsedDeckSummary; backup: BackupSummary }
  | { status: "error"; message: string }

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
  const [result, setResult] = useState<ProbeState>({ status: "idle" })
  const [isPending, startTransition] = useTransition()

  function handleFileChange(file: File | null) {
    if (!file) return

    startTransition(async () => {
      try {
        const backupBuffer = await file.arrayBuffer()
        const parseBuffer = backupBuffer.slice(0)
        const backup = await saveOriginalDeckBackup(file, backupBuffer)
        const deck = await parseApkgInWorker(file, parseBuffer)
        setResult({ status: "success", deck, backup })
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
              <p className="text-[15px] font-medium text-foreground">{result.backup.fileName}</p>
              <p className="font-mono text-[12px] text-muted-foreground">
                Backed up · {Math.round(result.backup.fileSize / 1024)} KB ·{" "}
                {new Date(result.backup.createdAt).toLocaleString()}
              </p>
            </div>
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
        )}
      </div>

      {/* Results — only shown after successful import */}
      {result.status === "success" && (
        <DeckResults deck={result.deck} backup={result.backup} />
      )}
    </div>
  )
}

function DeckResults({
  deck,
  backup,
}: {
  deck: ParsedDeckSummary
  backup: BackupSummary
}) {
  const [selectedNoteIndex, setSelectedNoteIndex] = useState(0)
  const selectedNote = deck.sampleNotes[selectedNoteIndex] ?? null

  return (
    <div className="space-y-5">

      {/* Stats overview */}
      <SectionCard label="Overview" heading="Deck stats">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <BigStat label="Notes" value={String(deck.noteCount)} />
          <BigStat label="Cards" value={String(deck.cardCount)} />
          <BigStat label="Note types" value={String(deck.noteTypeCount)} />
          <BigStat label="Media files" value={String(deck.mediaCount)} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SmallStat label="Templates" value={String(deck.templateCount)} />
          <SmallStat label="Named fields" value={String(deck.fieldCount)} />
          <SmallStat label="SQLite" value={deck.sqliteVersion} />
          <SmallStat label="Collection" value={deck.collectionFileName} />
        </div>
      </SectionCard>

      {/* Note types */}
      <SectionCard label="Schema" heading="Note types">
        <div className="space-y-3">
          {deck.noteTypes.map((noteType) => (
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
              {selectedNoteIndex + 1}/{deck.sampleNotes.length}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Next note"
              disabled={selectedNoteIndex >= deck.sampleNotes.length - 1}
              onClick={() =>
                setSelectedNoteIndex(Math.min(deck.sampleNotes.length - 1, selectedNoteIndex + 1))
              }
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
        <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
          {deck.sampleNotes.map((note, index) => {
            const noteType = deck.noteTypes.find((nt) => nt.id === note.noteTypeId)
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
        <CardPreviewSection note={selectedNote} noteTypes={deck.noteTypes} />
      )}

      {/* Media + Schema */}
      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard label="Assets" heading="Media manifest">
          {deck.mediaSamples.length === 0 ? (
            <p className="text-[15px] text-muted-foreground">No media entries found.</p>
          ) : (
            <div className="space-y-2">
              {deck.mediaSamples.map((item) => (
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
              {deck.tableNames.map((name) => (
                <span
                  key={name}
                  className="rounded-[6px] border border-border bg-muted px-2 py-1 font-mono text-[12px] text-muted-foreground"
                >
                  {name}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <SmallStat label="Zip entries" value={String(deck.zipEntryCount)} />
              <SmallStat
                label="Backup size"
                value={`${Math.round(backup.fileSize / 1024)} KB`}
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

function CardPreviewSection({
  note,
  noteTypes,
}: {
  note: ParsedNote
  noteTypes: ParsedNoteType[]
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

  const frontHtml = renderAnkiTemplate({ template: template.front, note, noteType })
  const backHtml = renderAnkiTemplate({ template: template.back, note, noteType })

  return (
    <SectionCard label="Render" heading="Card preview">
      <div className="mb-4 flex items-center gap-2">
        <span className="font-mono text-[12px] text-muted-foreground">{noteType.name}</span>
        <span className="text-muted-foreground">·</span>
        <span className="font-mono text-[12px] text-muted-foreground">{template.name}</span>
        <span className="ml-auto rounded-[6px] border border-border bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
          sandboxed iframe
        </span>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <PreviewFrame title="Front" html={createPreviewDocument({ title: "Front", body: frontHtml })} />
        <PreviewFrame title="Back" html={createPreviewDocument({ title: "Back", body: backHtml })} />
      </div>
    </SectionCard>
  )
}

function PreviewFrame({ title, html }: { title: string; html: string }) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-border bg-background">
      <div className="border-b border-border px-4 py-2 font-mono text-[12px] font-medium text-muted-foreground">
        {title}
      </div>
      <iframe
        title={`${title} card preview`}
        sandbox=""
        srcDoc={html}
        className="h-64 w-full bg-background"
      />
    </div>
  )
}
