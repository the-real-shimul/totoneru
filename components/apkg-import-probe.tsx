"use client"

import JSZip from "jszip"
import { LoaderCircle, Upload } from "lucide-react"
import { useId, useState, useTransition } from "react"
import initSqlJs from "sql.js/dist/sql-wasm.js"

import { Button } from "@/components/ui/button"

type ProbeState =
  | {
      status: "idle"
    }
  | {
      status: "success"
      fileName: string
      zipEntryCount: number
      collectionFileName: string
      sqliteVersion: string
      tableNames: string[]
    }
  | {
      status: "error"
      message: string
    }

let sqlInitPromise: ReturnType<typeof initSqlJs> | null = null

function getSql() {
  if (!sqlInitPromise) {
    sqlInitPromise = initSqlJs({
      locateFile: () => "/sql-wasm.wasm",
    })
  }

  return sqlInitPromise
}

export function ApkgImportProbe() {
  const inputId = useId()
  const [result, setResult] = useState<ProbeState>({ status: "idle" })
  const [isPending, startTransition] = useTransition()

  function handleFileChange(file: File | null) {
    if (!file) {
      return
    }

    startTransition(async () => {
      try {
        const buffer = await file.arrayBuffer()
        const zip = await JSZip.loadAsync(buffer)
        const entryNames = Object.keys(zip.files)
        const collectionFileName = entryNames.find(
          (entryName) =>
            entryName === "collection.anki21b" ||
            entryName.endsWith("/collection.anki21b")
        )

        if (!collectionFileName) {
          throw new Error("This package does not contain collection.anki21b.")
        }

        const collectionBytes = await zip.file(collectionFileName)?.async("uint8array")

        if (!collectionBytes) {
          throw new Error("Unable to read collection.anki21b from the archive.")
        }

        const SQL = await getSql()
        const database = new SQL.Database(collectionBytes)

        try {
          const versionRow = database.exec("select sqlite_version() as version")
          const tablesRow = database.exec(
            "select name from sqlite_master where type = 'table' order by name"
          )

          const sqliteVersion = String(versionRow[0]?.values[0]?.[0] ?? "unknown")
          const tableNames = (tablesRow[0]?.values ?? []).map((value: unknown[]) =>
            String(value[0])
          )

          setResult({
            status: "success",
            fileName: file.name,
            zipEntryCount: entryNames.length,
            collectionFileName,
            sqliteVersion,
            tableNames,
          })
        } finally {
          database.close()
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to inspect the package."

        setResult({
          status: "error",
          message,
        })
      }
    })
  }

  return (
    <section className="rounded-[2rem] border border-border/70 bg-card/85 p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
            S1.1 import probe
          </p>
          <h2 className="text-2xl font-semibold">Browser-side APKG unzip + SQLite check</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            This is the first parsing proof. It loads an `.apkg`, finds
            `collection.anki21b`, boots `sql.js` lazily, and inspects the SQLite tables
            without leaving the browser.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            id={inputId}
            type="file"
            accept=".apkg,application/octet-stream"
            className="sr-only"
            onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            size="lg"
            onClick={() => document.getElementById(inputId)?.click()}
            disabled={isPending}
          >
            {isPending ? <LoaderCircle className="animate-spin" /> : <Upload />}
            {isPending ? "Inspecting package" : "Choose .apkg"}
          </Button>
          <p className="text-xs text-muted-foreground">
            No upload. The file stays on your device.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-border/60 bg-background/70 p-5">
        {result.status === "idle" && (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>No package loaded yet.</p>
            <p>
              Success for this step means we can open the zip, read `collection.anki21b`,
              and query the SQLite schema in the browser.
            </p>
          </div>
        )}

        {result.status === "error" && (
          <div className="space-y-2 text-sm">
            <p className="font-medium text-destructive">Import probe failed</p>
            <p className="text-muted-foreground">{result.message}</p>
          </div>
        )}

        {result.status === "success" && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <ProbeStat label="File" value={result.fileName} />
              <ProbeStat label="Zip entries" value={String(result.zipEntryCount)} />
              <ProbeStat label="Collection file" value={result.collectionFileName} />
              <ProbeStat label="SQLite version" value={result.sqliteVersion} />
            </div>

            <div>
              <p className="text-sm font-medium">Detected tables</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.tableNames.map((tableName) => (
                  <span
                    key={tableName}
                    className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted-foreground"
                  >
                    {tableName}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function ProbeStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 break-all text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}
