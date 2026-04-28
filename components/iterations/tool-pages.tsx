"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

import { AiSettings } from "@/components/ai-settings"
import { BatchRunner } from "@/components/batch-runner"
import { ApkgImportProbe } from "@/components/apkg-import-probe"
import {
  EditorialSection,
  StatRule,
  docFor,
} from "@/components/iterations/editorial-primitives"
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

const EMPTY_FIELD_MAPPINGS: Record<string, FieldRole> = {}

export function ImportToolPage() {
  return (
    <ToolPageFrame station="Import">
      <EditorialSection
        eyebrow="Deck import"
        title="Upload, backup, inspect."
        doc={docFor("/decks", "deck-import")}
      >
        <ApkgImportProbe />
      </EditorialSection>
    </ToolPageFrame>
  )
}

export function AddCardsToolPage() {
  return (
    <ToolPageFrame station="Add Cards">
      <EditorialSection
        eyebrow="Manual cards"
        title="Create cards manually."
        doc={docFor("/decks", "manual-words")}
      >
        <ManualCardWorkbench />
      </EditorialSection>
    </ToolPageFrame>
  )
}

export function AiToolPage() {
  const [activeDeck, setActiveDeck] = useState<ActiveDeck | null>(null)
  const [selectedPrompt, setSelectedPrompt] = useState<UserPrompt | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    loadMostRecentActiveDeck().then((deck) => setActiveDeck(deck ?? null))
  }, [])

  return (
    <ToolPageFrame station="AI">
      <EditorialSection
        eyebrow="AI transformation"
        title="Configure AI and select prompts."
        doc={docFor("/ai", "api-keys")}
      >
        <div className="mb-4 grid gap-3 border-2 border-black p-4 font-mono text-[11px] font-bold tracking-[0.1em] uppercase sm:grid-cols-3">
          <p>1. Save provider key</p>
          <p>2. Import and map a deck</p>
          <p>3. Select or create a prompt</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="border border-black p-5">
            <AiSettings />
          </div>
          <div className="border border-black p-5">
            {activeDeck ? (
              <div className="space-y-4">
                <PromptLibrary
                  selectedPromptId={selectedPrompt?.id ?? null}
                  onSelectPrompt={setSelectedPrompt}
                />
                <button
                  type="button"
                  onClick={() => setShowEditor((value) => !value)}
                  className="border-2 border-black px-3 py-2 font-mono text-[11px] font-bold tracking-[0.1em] uppercase hover:bg-black hover:text-white"
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
                actionLabel="Go to Import"
                actionHref="/import"
              />
            )}
          </div>
        </div>
      </EditorialSection>
      <EditorialSection
        eyebrow="Prompt docs"
        title="How API calls work."
        doc={docFor("/ai", "prompts")}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <StatRule label="Request path" value="Browser to provider" />
          <StatRule label="Key storage" value="IndexedDB" />
          <StatRule label="Server proxy" value="None" />
        </div>
      </EditorialSection>
    </ToolPageFrame>
  )
}

export function BatchToolPage() {
  const [activeDeck, setActiveDeck] = useState<ActiveDeck | null>(null)
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null)

  useEffect(() => {
    loadMostRecentActiveDeck().then((deck) => setActiveDeck(deck ?? null))
  }, [])

  const getFieldMappings = useCallback(
    (noteTypeId: string): Record<string, FieldRole> =>
      activeDeck?.noteTypeMappings.find(
        (mapping) => mapping.noteTypeId === noteTypeId
      )?.fieldMappings ?? EMPTY_FIELD_MAPPINGS,
    [activeDeck]
  )

  const getTemplateSelection = useCallback(
    (noteTypeId: string): TemplateType =>
      activeDeck?.noteTypeMappings.find(
        (mapping) => mapping.noteTypeId === noteTypeId
      )?.templateSelection ?? "none",
    [activeDeck]
  )

  return (
    <ToolPageFrame station="Batch">
      <EditorialSection
        eyebrow="Batch editor"
        title="Preview changes before applying."
        doc={docFor("/ai", "batch")}
      >
        {activeDeck ? (
          <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="border border-black p-5">
              <StatRule label="Deck" value={activeDeck.fileName} />
              <div className="mt-4 grid grid-cols-2 gap-4">
                <StatRule
                  label="Notes"
                  value={String(activeDeck.deck.noteCount)}
                />
                <StatRule
                  label="Sample cards"
                  value={String(activeDeck.deck.sampleNotes.length)}
                />
              </div>
              <p className="mt-5 text-[14px] leading-[1.45]">
                Run a dry-run first, review the changed cards, then apply only
                the edits you want to export.
              </p>
            </div>
            <div className="border border-black p-5">
              <BatchRunner
                activeDeck={activeDeck}
                transformationConfigs={DEFAULT_TRANSFORMATIONS}
                selectedPrompt={null}
                getFieldMappings={getFieldMappings}
                getTemplateSelection={getTemplateSelection}
                onBatchResultChange={setBatchResult}
              />
              {batchResult && (
                <div
                  className={`mt-4 border-2 p-3 font-mono text-[12px] font-bold tracking-[0.1em] uppercase ${
                    batchResult.failedCount > 0
                      ? "border-black bg-white text-black"
                      : "border-black bg-black text-white"
                  }`}
                >
                  Last result: {batchResult.successCount} success /{" "}
                  {batchResult.failedCount} failed
                </div>
              )}
            </div>
          </div>
        ) : (
          <EmptyState
            title="No active deck yet."
            body="Import a deck first so the batch editor has parsed notes to stage."
            actionLabel="Go to Import"
            actionHref="/import"
          />
        )}
      </EditorialSection>
    </ToolPageFrame>
  )
}

export function ExportToolPage() {
  return (
    <ToolPageFrame station="Export">
      <EditorialSection
        eyebrow="Export options"
        title="Download your files."
        doc={docFor("/export", "deck-export")}
      >
        <ExportWorkbench />
      </EditorialSection>
    </ToolPageFrame>
  )
}

function ToolPageFrame({
  station,
  children,
}: {
  station: string
  children: React.ReactNode
}) {
  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-[34px] leading-none font-black tracking-[-0.03em] sm:text-[46px]">
            {station}
          </h1>
        </div>
        <div className="bg-white">{children}</div>
      </div>
    </div>
  )
}

function EmptyState({
  title,
  body,
  actionLabel,
  actionHref,
}: {
  title: string
  body: string
  actionLabel?: string
  actionHref?: string
}) {
  return (
    <div className="border-2 border-black p-8">
      <p className="font-mono text-[11px] font-bold tracking-[0.12em] text-[#757575] uppercase">
        Waiting
      </p>
      <h3 className="mt-2 text-[28px] leading-none font-black">{title}</h3>
      <p className="mt-3 max-w-xl text-[15px] leading-[1.5]">{body}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-5 inline-flex min-h-11 items-center justify-center border-2 border-black bg-black px-4 py-2 text-[14px] font-bold text-white transition-colors hover:bg-white hover:text-black"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
