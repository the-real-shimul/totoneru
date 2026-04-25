"use client"

import { useCallback, useEffect, useState } from "react"

import { AiSettings } from "@/components/ai-settings"
import { BatchRunner } from "@/components/batch-runner"
import { ApkgImportProbe } from "@/components/apkg-import-probe"
import { EditorialSection, StatRule, docFor } from "@/components/iterations/editorial-primitives"
import { ExportWorkbench } from "@/components/iterations/export-workbench"
import { ManualCardWorkbench } from "@/components/iterations/manual-card-workbench"
import { PromptEditor, PromptLibrary } from "@/components/prompt-library"
import type { ActiveDeck } from "@/lib/deck-model"
import { loadMostRecentActiveDeck } from "@/lib/deck-storage"
import type { UserPrompt } from "@/lib/prompts"
import type { FieldRole } from "@/lib/schema-mapping"
import type { TemplateType } from "@/lib/templates"
import { DEFAULT_TRANSFORMATIONS } from "@/lib/transformations"
import type { BatchResult } from "@/lib/batch-operations"
import type { IterationId } from "@/lib/iteration-ui"

const EMPTY_FIELD_MAPPINGS: Record<string, FieldRole> = {}

export function ImportToolPage({ iteration = "a" }: { iteration?: IterationId }) {
  return (
    <ToolPageFrame iteration={iteration} station="Deck intake">
      <EditorialSection
        eyebrow="Import desk"
        title="Upload, backup, inspect."
        doc={docFor("/decks", "deck-import")}
      >
        <ApkgImportProbe />
      </EditorialSection>
    </ToolPageFrame>
  )
}

export function AddCardsToolPage({ iteration = "a" }: { iteration?: IterationId }) {
  return (
    <ToolPageFrame iteration={iteration} station="Card forge">
      <EditorialSection
        eyebrow="Manual cards"
        title="Create cards without leaving the UI."
        doc={docFor("/decks", "manual-words")}
      >
        <ManualCardWorkbench />
      </EditorialSection>
    </ToolPageFrame>
  )
}

export function AiToolPage({ iteration = "a" }: { iteration?: IterationId }) {
  const [activeDeck, setActiveDeck] = useState<ActiveDeck | null>(null)
  const [selectedPrompt, setSelectedPrompt] = useState<UserPrompt | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    loadMostRecentActiveDeck().then((deck) => setActiveDeck(deck ?? null))
  }, [])

  return (
    <ToolPageFrame iteration={iteration} station="Prompt reactor">
      <EditorialSection
        eyebrow="AI transformation"
        title="Bring your own key. Keep the deck local."
        doc={docFor("/ai", "api-keys")}
      >
        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="border-2 border-black p-5">
            <AiSettings />
          </div>
          <div className="border-2 border-black p-5">
            {activeDeck ? (
              <div className="space-y-4">
                <PromptLibrary
                  selectedPromptId={selectedPrompt?.id ?? null}
                  onSelectPrompt={setSelectedPrompt}
                />
                <button
                  type="button"
                  onClick={() => setShowEditor((value) => !value)}
                  className="border-2 border-black px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em] hover:bg-black hover:text-white"
                >
                  {showEditor ? "Close prompt editor" : "Create custom prompt"}
                </button>
                {showEditor && (
                  <div className="border-t-2 border-black pt-4">
                    <PromptEditor
                      onSave={(prompt) => {
                        setSelectedPrompt(prompt)
                        setShowEditor(false)
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                title="Import a deck to preview prompts."
                body="AI settings can be saved now, but prompt variables need a mapped sample card."
              />
            )}
          </div>
        </div>
      </EditorialSection>
      <EditorialSection
        eyebrow="Prompt docs"
        title="What gets sent."
        doc={docFor("/ai", "prompts")}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <StatRule label="Request path" value="Browser → provider" />
          <StatRule label="Key storage" value="IndexedDB" />
          <StatRule label="Server proxy" value="None" />
        </div>
      </EditorialSection>
    </ToolPageFrame>
  )
}

export function BatchToolPage({ iteration = "a" }: { iteration?: IterationId }) {
  const [activeDeck, setActiveDeck] = useState<ActiveDeck | null>(null)
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null)

  useEffect(() => {
    loadMostRecentActiveDeck().then((deck) => setActiveDeck(deck ?? null))
  }, [])

  const getFieldMappings = useCallback(
    (noteTypeId: string): Record<string, FieldRole> =>
      activeDeck?.noteTypeMappings.find((mapping) => mapping.noteTypeId === noteTypeId)
        ?.fieldMappings ?? EMPTY_FIELD_MAPPINGS,
    [activeDeck]
  )

  const getTemplateSelection = useCallback(
    (noteTypeId: string): TemplateType =>
      activeDeck?.noteTypeMappings.find((mapping) => mapping.noteTypeId === noteTypeId)
        ?.templateSelection ?? "none",
    [activeDeck]
  )

  return (
    <ToolPageFrame iteration={iteration} station="Dry-run tunnel">
      <EditorialSection
        eyebrow="Batch editor"
        title="Dry-run before the big red lever."
        doc={docFor("/ai", "batch")}
      >
        {activeDeck ? (
          <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="border-2 border-black p-5">
              <StatRule label="Deck" value={activeDeck.fileName} />
              <div className="mt-4 grid grid-cols-2 gap-4">
                <StatRule label="Notes" value={String(activeDeck.deck.noteCount)} />
                <StatRule label="Sample cards" value={String(activeDeck.deck.sampleNotes.length)} />
              </div>
              <p className="mt-5 text-[14px] leading-[1.45]">
                Batch output is staged in IndexedDB. Export reads from the original backup and
                writes only a downloaded copy.
              </p>
            </div>
            <div className="border-2 border-black p-5">
              <BatchRunner
                activeDeck={activeDeck}
                transformationConfigs={DEFAULT_TRANSFORMATIONS}
                selectedPrompt={null}
                getFieldMappings={getFieldMappings}
                getTemplateSelection={getTemplateSelection}
                onBatchResultChange={setBatchResult}
              />
              {batchResult && (
                <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.1em] text-[#757575]">
                  Last result: {batchResult.successCount} success / {batchResult.failedCount} failed
                </p>
              )}
            </div>
          </div>
        ) : (
          <EmptyState
            title="No active deck yet."
            body="Import a deck first so the batch editor has parsed notes to stage."
          />
        )}
      </EditorialSection>
    </ToolPageFrame>
  )
}

export function ExportToolPage({ iteration = "a" }: { iteration?: IterationId }) {
  return (
    <ToolPageFrame iteration={iteration} station="Export hatch">
      <EditorialSection
        eyebrow="Export options"
        title="APKG, CSV, TSV, original backup."
        doc={docFor("/export", "deck-export")}
      >
        <ExportWorkbench />
      </EditorialSection>
    </ToolPageFrame>
  )
}

function ToolPageFrame({
  iteration,
  station,
  children,
}: {
  iteration: IterationId
  station: string
  children: React.ReactNode
}) {
  if (iteration !== "b") {
    return <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6">{children}</div>
  }

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="rotate-[-1deg] border-2 border-black bg-black p-5 text-white">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
              Factory station
            </p>
            <h1 className="mt-2 text-[46px] font-black leading-[0.9] tracking-[-0.04em]">
              {station}
            </h1>
          </div>
          <div className="min-h-32 border-2 border-black bg-white" aria-hidden="true" />
        </div>
        <div className="bg-white">{children}</div>
      </div>
    </div>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-2 border-black p-8">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#757575]">
        Waiting
      </p>
      <h3 className="mt-2 text-[28px] font-black leading-none">{title}</h3>
      <p className="mt-3 max-w-xl text-[15px] leading-[1.5]">{body}</p>
    </div>
  )
}
