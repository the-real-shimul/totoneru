"use client"

import { AlertTriangle, CheckCircle, LoaderCircle, Play, RotateCcw, Square, XCircle } from "lucide-react"
import { useCallback, useEffect, useId, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import type { ActiveDeck } from "@/lib/deck-model"
import {
  runBatch,
  runDryRun,
  type BatchConfig,
  type BatchResult,
  type CardResult,
} from "@/lib/batch-operations"
import {
  deleteStagedChanges,
  loadStagedChanges,
  saveBatchResult,
  saveStagedChanges,
} from "@/lib/batch-storage"
import { loadBackupData } from "@/lib/deck-storage"
import type { ParsedNote, ParsedNoteType, LoadAllNotesRequest, LoadAllNotesResponse } from "@/lib/apkg-parser-types"
import type { UserPrompt } from "@/lib/prompts"
import type { TemplateType } from "@/lib/templates"
import type { FieldRole } from "@/lib/schema-mapping"
import type { TransformationConfig } from "@/lib/transformations"

type BatchRunnerProps = {
  activeDeck: ActiveDeck
  transformationConfigs: TransformationConfig[]
  selectedPrompt: UserPrompt | null
  getFieldMappings: (noteTypeId: string) => Record<string, FieldRole>
  getTemplateSelection: (noteTypeId: string) => TemplateType
  onBatchResultChange?: (result: BatchResult | null) => void
}

function loadAllNotesFromBackup(buffer: ArrayBuffer): Promise<{ notes: ParsedNote[]; noteTypes: ParsedNoteType[] }> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("../workers/apkg-parser.worker.ts", import.meta.url),
      { type: "module" }
    )
    worker.onmessage = (event: MessageEvent<LoadAllNotesResponse>) => {
      worker.terminate()
      if (event.data.type === "allNotes") {
        resolve({ notes: event.data.notes, noteTypes: event.data.noteTypes })
      } else {
        reject(new Error(event.data.message))
      }
    }
    worker.onerror = (err) => {
      worker.terminate()
      reject(new Error(err.message))
    }
    const req: LoadAllNotesRequest = { type: "loadAllNotes", buffer }
    worker.postMessage(req, [req.buffer])
  })
}

export function BatchRunner({
  activeDeck,
  transformationConfigs,
  selectedPrompt,
  getFieldMappings,
  getTemplateSelection,
  onBatchResultChange,
}: BatchRunnerProps) {
  const spendCapId = useId()
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isDryRun, setIsDryRun] = useState(false)
  const [dryRunConfirmed, setDryRunConfirmed] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [hasStaged, setHasStaged] = useState(false)
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [spendCapInput, setSpendCapInput] = useState("")
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    loadStagedChanges(activeDeck.id).then((staged) => {
      setHasStaged(staged !== undefined)
      if (staged) {
        const result: BatchResult = {
          deckId: staged.deckId,
          totalCards: staged.cardResults.length,
          processedCount: staged.cardResults.length,
          successCount: staged.cardResults.filter((r) => r.status === "success").length,
          failedCount: staged.cardResults.filter((r) => r.status === "error").length,
          cardResults: staged.cardResults,
          completedAt: staged.createdAt,
        }
        setBatchResult(result)
        onBatchResultChange?.(result)
      }
    })
  }, [activeDeck.id, onBatchResultChange])

  const buildConfig = useCallback((spendCapUsd?: number): BatchConfig => {
    const fieldMappingsByNoteType: Record<string, Record<string, FieldRole>> = {}
    const templateSelectionsByNoteType: Record<string, TemplateType> = {}

    for (const noteType of activeDeck.deck.noteTypes) {
      fieldMappingsByNoteType[noteType.id] = getFieldMappings(noteType.id)
      templateSelectionsByNoteType[noteType.id] = getTemplateSelection(noteType.id)
    }

    return {
      deckId: activeDeck.id,
      transformationConfigs,
      prompt: selectedPrompt,
      fieldMappingsByNoteType,
      templateSelectionsByNoteType,
      spendCapUsd,
    }
  }, [activeDeck, transformationConfigs, selectedPrompt, getFieldMappings, getTemplateSelection])

  async function handleDryRun() {
    setIsDryRun(true)
    setIsRunning(true)
    setDryRunConfirmed(false)
    setProgress({ current: 0, total: Math.min(5, activeDeck.deck.sampleNotes.length) })

    const config = buildConfig()
    const result = await runDryRun({
      notes: activeDeck.deck.sampleNotes,
      noteTypes: activeDeck.deck.noteTypes,
      config,
    })

    setBatchResult(result)
    onBatchResultChange?.(result)
    setIsRunning(false)
  }

  async function handleRunBatch() {
    if (!dryRunConfirmed) {
      return
    }

    setIsDryRun(false)
    setIsRunning(true)

    const spendCapUsd = spendCapInput.trim() ? parseFloat(spendCapInput) : undefined

    // Load all notes from the backup so we process the full deck, not just the 50-card sample
    let allNotes: ParsedNote[] = activeDeck.deck.sampleNotes
    let allNoteTypes: ParsedNoteType[] = activeDeck.deck.noteTypes

    try {
      setLoadingNotes(true)
      const buffer = await loadBackupData(activeDeck.backupId)
      if (buffer) {
        const loaded = await loadAllNotesFromBackup(buffer)
        allNotes = loaded.notes
        allNoteTypes = loaded.noteTypes
      }
    } catch {
      // If loading the full deck fails, fall back to the sample notes
    } finally {
      setLoadingNotes(false)
    }

    setProgress({ current: 0, total: allNotes.length })

    abortRef.current = new AbortController()

    const config = buildConfig(spendCapUsd)
    const result = await runBatch({
      notes: allNotes,
      noteTypes: allNoteTypes,
      config,
      onProgress: (p) => setProgress({ current: p.current, total: p.total }),
      signal: abortRef.current.signal,
    })

    setBatchResult(result)
    onBatchResultChange?.(result)
    setIsRunning(false)
    setHasStaged(true)

    await saveBatchResult(result)
    await saveStagedChanges({
      deckId: activeDeck.id,
      cardResults: result.cardResults,
      config,
      createdAt: new Date().toISOString(),
    })
  }

  function handleAbort() {
    abortRef.current?.abort()
  }

  async function handleDiscard() {
    await deleteStagedChanges(activeDeck.id)
    setBatchResult(null)
    onBatchResultChange?.(null)
    setHasStaged(false)
    setDryRunConfirmed(false)
  }

  async function handleRetryFailed() {
    if (!batchResult) return

    const failedNoteIds = new Set(
      batchResult.cardResults.filter((r) => r.status === "error").map((r) => r.noteId)
    )

    const failedNotes = activeDeck.deck.sampleNotes.filter((n) => failedNoteIds.has(n.id))
    if (failedNotes.length === 0) return

    setIsRunning(true)
    abortRef.current = new AbortController()

    const config = buildConfig()
    const retryResult = await runBatch({
      notes: failedNotes,
      noteTypes: activeDeck.deck.noteTypes,
      config,
      onProgress: (p) => setProgress({ current: p.current, total: p.total }),
      signal: abortRef.current.signal,
    })

    const mergedResults = batchResult.cardResults.map((existing) => {
      const retry = retryResult.cardResults.find((r) => r.noteId === existing.noteId)
      return retry?.status === "success" ? retry : existing
    })

    const merged: BatchResult = {
      ...batchResult,
      cardResults: mergedResults,
      successCount: mergedResults.filter((r) => r.status === "success").length,
      failedCount: mergedResults.filter((r) => r.status === "error").length,
      completedAt: new Date().toISOString(),
    }

    setBatchResult(merged)
    onBatchResultChange?.(merged)
    setIsRunning(false)

    await saveBatchResult(merged)
    await saveStagedChanges({
      deckId: activeDeck.id,
      cardResults: mergedResults,
      config,
      createdAt: new Date().toISOString(),
    })
  }

  const canRunBatch = !isRunning && dryRunConfirmed && !hasStaged

  return (
    <div className="space-y-4">
      {selectedPrompt && (
        <div className="flex items-center gap-3">
          <label htmlFor={spendCapId} className="shrink-0 text-[13px] text-muted-foreground">
            Spend cap (USD)
          </label>
          <input
            id={spendCapId}
            type="number"
            min="0"
            step="0.01"
            value={spendCapInput}
            onChange={(e) => setSpendCapInput(e.target.value)}
            placeholder="No limit"
            className="w-28 rounded-[8px] border border-border bg-background px-3 py-1.5 text-[13px] text-foreground outline-none"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleDryRun}
          disabled={isRunning}
        >
          {isRunning && isDryRun ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Play />
          )}
          Dry-run (5 cards)
        </Button>

        {!dryRunConfirmed && batchResult && isDryRun && (
          <Button
            type="button"
            onClick={() => setDryRunConfirmed(true)}
          >
            <CheckCircle />
            Confirm dry-run
          </Button>
        )}

        <Button
          type="button"
          onClick={handleRunBatch}
          disabled={!canRunBatch}
          className={
            canRunBatch
              ? "bg-[#D93A26] text-[#FAF7F2] hover:bg-[#C23220]"
              : undefined
          }
        >
          {isRunning && !isDryRun ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Play />
          )}
          Apply to all ({activeDeck.deck.noteCount} notes)
        </Button>

        {isRunning && !isDryRun && (
          <Button
            type="button"
            variant="outline"
            onClick={handleAbort}
          >
            <Square />
            Abort
          </Button>
        )}

        {hasStaged && !isRunning && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleRetryFailed}
              disabled={batchResult?.failedCount === 0}
            >
              <RotateCcw />
              Retry failed
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDiscard}
            >
              <XCircle />
              Discard
            </Button>
          </>
        )}
      </div>

      {isRunning && !isDryRun && (
        <div className="rounded-[12px] border border-border bg-background/60 p-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-[14px] font-medium text-foreground" id="batch-progress-label">
              {loadingNotes ? "Loading deck…" : "Processing cards…"}
            </p>
            {!loadingNotes && (
              <span className="font-mono text-[12px] text-muted-foreground" aria-hidden="true">
                {progress.current}/{progress.total}
              </span>
            )}
          </div>
          {!loadingNotes && (
            <div
              className="h-2 rounded-full bg-muted overflow-hidden"
              role="progressbar"
              aria-labelledby="batch-progress-label"
              aria-valuenow={progress.current}
              aria-valuemin={0}
              aria-valuemax={progress.total}
            >
              <div
                className="h-full rounded-full bg-[#4A7A4E] transition-all duration-300"
                style={{
                  width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                }}
              />
            </div>
          )}
        </div>
      )}

      {batchResult?.abortReason === "spendCap" && (
        <div className="flex items-center gap-2 rounded-[8px] border border-[rgba(184,135,58,0.30)] bg-[rgba(184,135,58,0.08)] px-3 py-2">
          <AlertTriangle className="size-4 shrink-0 text-[#8A6528]" />
          <p className="text-[13px] text-[#8A6528]">
            Batch stopped — spend cap reached. Results below are for cards processed so far.
          </p>
        </div>
      )}

      {batchResult && (
        <BatchSummary
          result={batchResult}
          isDryRun={isDryRun && !dryRunConfirmed}
          noteTypes={activeDeck.deck.noteTypes}
        />
      )}
    </div>
  )
}

function BatchSummary({
  result,
  isDryRun,
  noteTypes,
}: {
  result: BatchResult
  isDryRun: boolean
  noteTypes: ParsedNoteType[]
}) {
  const changedCount = result.cardResults.filter((c) => c.changed).length

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[rgba(74,122,78,0.12)] px-2.5 py-1 font-mono text-[11px] font-semibold text-[#2E5C33]">
          {result.successCount} success
        </span>
        {result.failedCount > 0 && (
          <span className="rounded-full bg-[rgba(217,58,38,0.10)] px-2.5 py-1 font-mono text-[11px] font-semibold text-[#A8321A]">
            {result.failedCount} failed
          </span>
        )}
        {changedCount > 0 && (
          <span className="rounded-full bg-muted px-2.5 py-1 font-mono text-[11px] font-semibold text-muted-foreground">
            {changedCount} changed
          </span>
        )}
        {isDryRun && (
          <span className="rounded-full bg-[rgba(184,135,58,0.12)] px-2.5 py-1 font-mono text-[11px] font-semibold text-[#8A6528]">
            Dry-run
          </span>
        )}
      </div>

      <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
        {result.cardResults.map((card) => (
          <CardResultRow
            key={card.noteId}
            card={card}
            noteType={noteTypes.find((nt) =>
              card.fieldOrder.some((fn) => nt.fieldNames.includes(fn))
            )}
          />
        ))}
      </div>
    </div>
  )
}

function CardResultRow({
  card,
  noteType,
}: {
  card: CardResult
  noteType: ParsedNoteType | undefined
}) {
  const [expanded, setExpanded] = useState(false)

  const diffs = card.changed
    ? card.originalFields
        .map((before, i) => ({
          fieldName: noteType?.fieldNames[i] ?? `Field ${i + 1}`,
          before,
          after: card.transformedFields[i] ?? "",
        }))
        .filter((d) => d.before !== d.after)
    : []

  return (
    <div
      className={`rounded-[12px] border p-4 ${
        card.status === "error"
          ? "border-[rgba(217,58,38,0.20)] bg-[rgba(217,58,38,0.04)]"
          : card.changed
            ? "border-[rgba(74,122,78,0.20)] bg-[rgba(74,122,78,0.04)]"
            : "border-border bg-background/60"
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2">
          {card.status === "error" ? (
            <XCircle className="size-4 text-[#A8321A]" />
          ) : card.changed ? (
            <CheckCircle className="size-4 text-[#4A7A4E]" />
          ) : (
            <CheckCircle className="size-4 text-muted-foreground" />
          )}
          <span className="text-[14px] font-medium text-foreground">
            Card #{card.noteId}
          </span>
          {noteType && (
            <span className="font-mono text-[12px] text-muted-foreground">
              {noteType.name}
            </span>
          )}
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">
          {card.changed ? `${diffs.length} changes` : card.status === "error" ? "Error" : "No change"}
        </span>
      </button>

      {card.status === "error" && card.error && (
        <p className="mt-2 text-[13px] text-[#A8321A]">{card.error}</p>
      )}

      {expanded && diffs.length > 0 && (
        <div className="mt-3 space-y-2">
          {diffs.map((diff) => (
            <div key={diff.fieldName} className="rounded-[8px] border border-border bg-card p-3">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                {diff.fieldName}
              </p>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <div className="rounded-[6px] border border-border px-3 py-2">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                    Before
                  </p>
                  <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-[13px] text-foreground">
                    {diff.before || "(empty)"}
                  </p>
                </div>
                <div className="rounded-[6px] border border-border px-3 py-2">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                    After
                  </p>
                  <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-[13px] text-foreground">
                    {diff.after || "(empty)"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
