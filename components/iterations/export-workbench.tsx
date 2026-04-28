"use client"

import {
  Download,
  FileArchive,
  FilePlus2,
  FileText,
  LoaderCircle,
  ShieldCheck,
  Table2,
  type LucideIcon,
} from "lucide-react"
import { useEffect, useState } from "react"

import {
  buildManualWordsCsv,
  buildManualWordsTsv,
  buildStandaloneManualWordsApkg,
  buildTransformedApkg,
} from "@/lib/anki-export"
import { loadBackupData, loadMostRecentActiveDeck } from "@/lib/deck-storage"
import type { ActiveDeck } from "@/lib/deck-model"
import { downloadBuffer } from "@/lib/download"
import { listManualWords, type ManualWord } from "@/lib/manual-words"
import { DEFAULT_TRANSFORMATIONS } from "@/lib/transformations"

export function ExportWorkbench() {
  const [activeDeck, setActiveDeck] = useState<ActiveDeck | null>(null)
  const [manualWords, setManualWords] = useState<ManualWord[]>([])
  const [isExporting, setIsExporting] = useState<string | null>(null)
  const [message, setMessage] = useState("")

  useEffect(() => {
    loadMostRecentActiveDeck().then((deck) => setActiveDeck(deck ?? null))
    listManualWords().then(setManualWords)
  }, [])

  const standaloneCount = manualWords.filter((word) =>
    word.targets.includes("standalone")
  ).length
  const deckMergeCount = manualWords.filter((word) =>
    word.targets.includes("deck")
  ).length

  async function withExport(label: string, action: () => Promise<void>) {
    setIsExporting(label)
    setMessage("")
    try {
      await action()
      setMessage(`${label} ready.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `${label} failed.`)
    } finally {
      setIsExporting(null)
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
      <div className="border-2 border-black p-5">
        <p className="font-mono text-[11px] font-bold tracking-[0.12em] text-[#757575] uppercase">
          Summary
        </p>
        <h3 className="mt-1 text-[30px] leading-none font-black tracking-[-0.02em]">
          Choose the file you need.
        </h3>
        <p className="mt-4 text-[15px] leading-[1.5] text-[#4a4a4a]">
          Export a transformed copy of the imported deck, download the untouched
          backup, or create files from manual cards.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-4 border-t-2 border-black pt-4">
          <Stat
            label="Deck cards"
            value={activeDeck ? String(activeDeck.deck.noteCount) : "0"}
          />
          <Stat label="Manual cards" value={String(manualWords.length)} />
        </div>
      </div>

      <div className="border-2 border-black p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <ExportAction
            title="Transformed deck"
            icon={FileArchive}
            detail={
              activeDeck
                ? `Copy of ${activeDeck.fileName} with staged changes and ${deckMergeCount} deck-targeted manual cards`
                : "Import a deck first"
            }
            disabled={!activeDeck}
            loading={isExporting === "Transformed APKG"}
            onClick={() =>
              withExport("Transformed APKG", async () => {
                if (!activeDeck) return
                const original = await loadBackupData(activeDeck.backupId)
                if (!original) throw new Error("Original backup not found.")
                const result = await buildTransformedApkg(original, {
                  activeDeck,
                  transformationConfigs: DEFAULT_TRANSFORMATIONS,
                  batchResult: null,
                  manualWords,
                })
                if (!result.success || !result.transformedBuffer) {
                  throw new Error(result.errorMessage || "APKG export failed.")
                }
                const name = activeDeck.fileName.replace(/\.apkg$/i, "")
                downloadBuffer(
                  result.transformedBuffer,
                  `${name}-totoneru.apkg`
                )
              })
            }
          />
          <ExportAction
            title="Original backup"
            icon={ShieldCheck}
            detail={
              activeDeck
                ? "The untouched .apkg saved before parsing"
                : "Import a deck first"
            }
            disabled={!activeDeck}
            loading={isExporting === "Original APKG"}
            onClick={() =>
              withExport("Original APKG", async () => {
                if (!activeDeck) return
                const original = await loadBackupData(activeDeck.backupId)
                if (!original) throw new Error("Original backup not found.")
                downloadBuffer(original, activeDeck.fileName)
              })
            }
          />
          <ExportAction
            title="Manual-card APKG"
            icon={FilePlus2}
            detail={
              standaloneCount > 0
                ? `${standaloneCount} manual cards in a new Anki package`
                : "Add standalone manual cards first"
            }
            disabled={standaloneCount === 0}
            loading={isExporting === "Standalone APKG"}
            onClick={() =>
              withExport("Standalone APKG", async () => {
                const buffer = await buildStandaloneManualWordsApkg(manualWords)
                downloadBuffer(buffer, "totoneru-manual-cards.apkg")
              })
            }
          />
          <ExportAction
            title="CSV"
            icon={Table2}
            detail={
              standaloneCount > 0
                ? "Quoted UTF-8 text for Anki or spreadsheets"
                : "Add standalone manual cards first"
            }
            disabled={standaloneCount === 0}
            loading={isExporting === "CSV"}
            onClick={() =>
              withExport("CSV", async () => {
                const buffer = new TextEncoder().encode(
                  buildManualWordsCsv(manualWords)
                ).buffer
                downloadBuffer(buffer, "totoneru-manual-cards.csv")
              })
            }
          />
          <ExportAction
            title="TSV"
            icon={FileText}
            detail={
              standaloneCount > 0
                ? "Tab-separated UTF-8 text for simple imports"
                : "Add standalone manual cards first"
            }
            disabled={standaloneCount === 0}
            loading={isExporting === "TSV"}
            onClick={() =>
              withExport("TSV", async () => {
                const buffer = new TextEncoder().encode(
                  buildManualWordsTsv(manualWords)
                ).buffer
                downloadBuffer(buffer, "totoneru-manual-cards.tsv")
              })
            }
          />
        </div>

        {message && (
          <div className="mt-4 flex items-center gap-2 border-2 border-black p-3 font-mono text-[12px] tracking-[0.08em] uppercase">
            <ShieldCheck className="size-4" />
            {message}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[11px] font-bold tracking-[0.12em] text-[#757575] uppercase">
        {label}
      </p>
      <p className="mt-1 font-mono text-[24px] font-black">{value}</p>
    </div>
  )
}

function ExportAction({
  title,
  icon: Icon,
  detail,
  disabled,
  loading,
  onClick,
}: {
  title: string
  icon: LucideIcon
  detail: string
  disabled: boolean
  loading: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className="min-h-36 border-2 border-black p-4 text-left transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="flex items-start justify-between gap-2">
        <Icon className="size-5" />
        {loading ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Download className="size-4" />
        )}
      </div>
      <p className="mt-5 text-[19px] leading-none font-black">{title}</p>
      <p className="mt-2 text-[13px] leading-[1.35]">{detail}</p>
    </button>
  )
}
