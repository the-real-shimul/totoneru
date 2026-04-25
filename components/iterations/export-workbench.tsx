"use client"

import { Download, FileArchive, LoaderCircle, ShieldCheck } from "lucide-react"
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
import { exportFormats } from "@/lib/iteration-ui"
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
  const deckMergeCount = manualWords.filter((word) => word.targets.includes("deck")).length

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
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="border-2 border-black p-5">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#757575]">
          Export desk
        </p>
        <h3 className="mt-1 text-[30px] font-black leading-none tracking-[-0.02em]">
          APKG, CSV, TSV.
        </h3>
        <div className="mt-5 divide-y divide-black border-y-2 border-black">
          {exportFormats.map((format) => (
            <div key={format.label} className="py-3">
              <p className="font-mono text-[12px] font-bold uppercase tracking-[0.1em]">
                {format.label}
              </p>
              <p className="mt-1 text-[14px] leading-[1.45] text-[#4a4a4a]">
                {format.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-2 border-black p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <ExportAction
            title="Transformed deck"
            detail={
              activeDeck
                ? `${activeDeck.fileName} plus ${deckMergeCount} staged manual cards`
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
                downloadBuffer(result.transformedBuffer, `${name}-totoneru.apkg`)
              })
            }
          />
          <ExportAction
            title="Original backup"
            detail={activeDeck ? "Untouched import backup" : "Import a deck first"}
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
            title="Standalone APKG"
            detail={`${standaloneCount} manual cards targeted`}
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
            detail="UTF-8, quoted, Anki import-friendly"
            disabled={standaloneCount === 0}
            loading={isExporting === "CSV"}
            onClick={() =>
              withExport("CSV", async () => {
                const buffer = new TextEncoder().encode(buildManualWordsCsv(manualWords)).buffer
                downloadBuffer(buffer, "totoneru-manual-cards.csv")
              })
            }
          />
          <ExportAction
            title="TSV"
            detail="UTF-8, tab-separated"
            disabled={standaloneCount === 0}
            loading={isExporting === "TSV"}
            onClick={() =>
              withExport("TSV", async () => {
                const buffer = new TextEncoder().encode(buildManualWordsTsv(manualWords)).buffer
                downloadBuffer(buffer, "totoneru-manual-cards.tsv")
              })
            }
          />
        </div>

        {message && (
          <div className="mt-4 flex items-center gap-2 border-2 border-black p-3 font-mono text-[12px] uppercase tracking-[0.08em]">
            <ShieldCheck className="size-4" />
            {message}
          </div>
        )}
      </div>
    </div>
  )
}

function ExportAction({
  title,
  detail,
  disabled,
  loading,
  onClick,
}: {
  title: string
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
      className="min-h-36 border-2 border-black p-4 text-left transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
    >
      <div className="flex items-start justify-between gap-2">
        <FileArchive className="size-5" />
        {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />}
      </div>
      <p className="mt-5 text-[19px] font-black leading-none">{title}</p>
      <p className="mt-2 text-[13px] leading-[1.35]">{detail}</p>
    </button>
  )
}
