"use client"

import { useEffect, useState } from "react"

const lines = [
  "Your Anki deck stays inside this browser.",
  "Dry-run first. Bulk edits later.",
  "Add new cards, then merge them into an exported copy.",
  "BYO AI key. No proxy. No surprise storage.",
  "Export APKG, CSV, or TSV when the batch looks right.",
]

export function TypewriterRibbon() {
  const [lineIndex, setLineIndex] = useState(0)
  const [visibleText, setVisibleText] = useState("")
  const [mode, setMode] = useState<"typing" | "pausing" | "deleting">("typing")

  useEffect(() => {
    const currentLine = lines[lineIndex]
    let timeout = 70

    if (mode === "typing") {
      if (visibleText.length < currentLine.length) {
        timeout = 38 + Math.random() * 42
        const timer = window.setTimeout(() => {
          setVisibleText(currentLine.slice(0, visibleText.length + 1))
        }, timeout)
        return () => window.clearTimeout(timer)
      }
      const timer = window.setTimeout(() => setMode("pausing"), 1300)
      return () => window.clearTimeout(timer)
    }

    if (mode === "pausing") {
      const timer = window.setTimeout(() => setMode("deleting"), 900)
      return () => window.clearTimeout(timer)
    }

    if (visibleText.length > 0) {
      timeout = 20 + Math.random() * 28
      const timer = window.setTimeout(() => {
        setVisibleText(currentLine.slice(0, visibleText.length - 1))
      }, timeout)
      return () => window.clearTimeout(timer)
    }

    const timer = window.setTimeout(() => {
      setLineIndex((current) => (current + 1) % lines.length)
      setMode("typing")
    }, 240)
    return () => window.clearTimeout(timer)
  }, [lineIndex, mode, visibleText])

  return (
    <div className="border-b-2 border-black bg-white px-4 py-3 text-black sm:px-6">
      <div className="mx-auto flex max-w-[1500px] items-center gap-3">
        <div
          className="min-h-11 flex-1 border-2 border-black px-3 py-2 font-mono text-[14px] font-bold uppercase tracking-[0.1em] sm:text-[16px]"
          aria-live="polite"
        >
          <span className="motion-reduce:hidden">
            {visibleText}
            <span className="typewriter-caret" aria-hidden="true" />
          </span>
          <span className="hidden motion-reduce:inline">
            Your Anki deck stays inside this browser.
          </span>
        </div>
      </div>
    </div>
  )
}
