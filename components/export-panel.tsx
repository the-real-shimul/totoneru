"use client"

import { Download, FileArchive, LoaderCircle, ShieldCheck } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import type { ActiveDeck } from "@/lib/deck-model"
import { loadBackupData } from "@/lib/deck-storage"
import { downloadBuffer } from "@/lib/download"
import { buildTransformedApkg } from "@/lib/anki-export"
import type { BatchResult } from "@/lib/batch-operations"
import type { TransformationConfig } from "@/lib/transformations"

type ExportPanelProps = {
  activeDeck: ActiveDeck
  transformationConfigs: TransformationConfig[]
  batchResult: BatchResult | null
}

export function ExportPanel({
  activeDeck,
  transformationConfigs,
  batchResult,
}: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [lastResult, setLastResult] = useState<{
    changed: number
    unchanged: number
    verified: boolean
    error?: string
  } | null>(null)

  async function handleExportTransformed() {
    setIsExporting(true)
    setLastResult(null)

    try {
      const originalBuffer = await loadBackupData(activeDeck.backupId)
      if (!originalBuffer) {
        setLastResult({
          changed: 0,
          unchanged: 0,
          verified: false,
          error: "Original backup not found.",
        })
        return
      }

      const result = await buildTransformedApkg(originalBuffer, {
        activeDeck,
        transformationConfigs,
        batchResult,
      })

      if (result.success && result.transformedBuffer) {
        const name = activeDeck.fileName.replace(/\.apkg$/i, "")
        downloadBuffer(
          result.transformedBuffer,
          `${name}-transformed.apkg`
        )
      }

      setLastResult({
        changed: result.changedNoteCount,
        unchanged: result.unchangedNoteCount,
        verified: result.verified,
        error: result.errorMessage || undefined,
      })
    } catch (err) {
      setLastResult({
        changed: 0,
        unchanged: 0,
        verified: false,
        error: err instanceof Error ? err.message : "Export failed",
      })
    } finally {
      setIsExporting(false)
    }
  }

  async function handleDownloadOriginal() {
    const originalBuffer = await loadBackupData(activeDeck.backupId)
    if (!originalBuffer) return
    downloadBuffer(originalBuffer, activeDeck.fileName)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={handleExportTransformed}
          disabled={isExporting}
          className="bg-[#D93A26] text-[#FAF7F2] hover:bg-[#C23220]"
        >
          {isExporting ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <FileArchive />
          )}
          {isExporting ? "Exporting…" : "Export transformed"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleDownloadOriginal}
          disabled={isExporting}
        >
          <Download />
          Download original
        </Button>
      </div>

      {lastResult && (
        <div className=" border-2 border-black bg-white p-4 space-y-2">
          <div className="flex items-center gap-2">
            {lastResult.error ? (
              <span className=" bg-[rgba(217,58,38,0.10)] px-2.5 py-1 font-mono text-[11px] font-semibold text-[#A8321A]">
                Failed
              </span>
            ) : lastResult.verified ? (
              <>
                <ShieldCheck className="size-4 text-[#4A7A4E]" />
                <span className=" bg-[rgba(74,122,78,0.12)] px-2.5 py-1 font-mono text-[11px] font-semibold text-[#2E5C33]">
                  Verified
                </span>
              </>
            ) : (
              <span className=" bg-[rgba(184,135,58,0.12)] px-2.5 py-1 font-mono text-[11px] font-semibold text-[#8A6528]">
                Unverified
              </span>
            )}
          </div>

          {lastResult.error ? (
            <p className="text-[13px] text-[#A8321A]">{lastResult.error}</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              <span className="font-mono text-[12px] text-[#757575]">
                {lastResult.changed} changed
              </span>
              <span className="font-mono text-[12px] text-[#757575]">
                {lastResult.unchanged} unchanged
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
