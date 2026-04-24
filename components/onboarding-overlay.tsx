"use client"

import { useEffect, useId, useRef, useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

const ONBOARDING_KEY = "totoneru_onboarding_dismissed"

function hasBeenDismissed(): boolean {
  if (typeof window === "undefined") return true
  return localStorage.getItem(ONBOARDING_KEY) === "true"
}

export function OnboardingOverlay() {
  const [visible, setVisible] = useState(() => !hasBeenDismissed())
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  function dismiss() {
    localStorage.setItem(ONBOARDING_KEY, "true")
    setVisible(false)
  }

  useEffect(() => {
    if (!visible) return

    const dialog = dialogRef.current
    if (!dialog) return

    const previouslyFocused = document.activeElement as HTMLElement | null

    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(", ")

    function getFocusableElements(): HTMLElement[] {
      if (!dialog) return []
      return Array.from(dialog.querySelectorAll(focusableSelectors))
    }

    const focusables = getFocusableElements()
    if (focusables.length > 0) {
      focusables[0].focus()
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        dismiss()
        return
      }

      if (event.key !== "Tab") return

      const elements = getFocusableElements()
      if (elements.length === 0) {
        event.preventDefault()
        return
      }

      const first = elements[0]
      const last = elements[elements.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      previouslyFocused?.focus()
    }
  }, [visible])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/50 p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg rounded-[20px] border border-border bg-[#FAF7F2] p-8 shadow-[0_24px_48px_rgba(26,26,26,0.16)]"
      >
        <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Welcome
        </p>
        <h2
          id={titleId}
          className="text-balance text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#1A1A1A]"
        >
          Transform your Anki deck in the browser
        </h2>

        <div className="mt-6 space-y-3">
          <Step number={1} title="Import your .apkg">
            Drag and drop or pick your Anki deck. It is parsed entirely in your browser — nothing is uploaded.
          </Step>
          <Step number={2} title="Map fields & pick a template">
            totoneru guesses what each field means. You can edit the mappings and choose a Vocabulary or Sentence template.
          </Step>
          <Step number={3} title="Preview & transform">
            Toggle built-in transformations (furigana, HTML clean, normalizer) or run AI prompts with your own API key.
          </Step>
          <Step number={4} title="Dry-run, then export">
            Review changes on 5 sample cards first. Confirm, then export a clean .apkg back to Anki.
          </Step>
        </div>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Link
            href="/how-it-works"
            className="text-center text-[14px] text-muted-foreground hover:text-foreground transition-colors sm:mr-auto"
            onClick={dismiss}
          >
            Learn more
          </Link>
          <Button type="button" variant="outline" onClick={dismiss}>
            Got it
          </Button>
          <Button
            type="button"
            onClick={dismiss}
            className="bg-[#1A1A1A] text-[#FAF7F2] hover:bg-black"
          >
            Start importing
          </Button>
        </div>
      </div>
    </div>
  )
}

function Step({
  number,
  title,
  children,
}: {
  number: number
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted font-mono text-[11px] font-semibold text-muted-foreground">
        {number}
      </span>
      <div>
        <p className="text-[14px] font-medium text-foreground">{title}</p>
        <p className="text-[13px] text-muted-foreground leading-[1.5]">{children}</p>
      </div>
    </div>
  )
}
