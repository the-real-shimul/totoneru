"use client"

import Link from "next/link"
import {
  Database,
  Eye,
  KeyRound,
  Lock,
  Monitor,
  ShieldCheck,
  Workflow,
} from "lucide-react"
import { useEffect, useState } from "react"

import { DocumentationPanel } from "@/components/iterations/documentation-toggle"
import { InkButton } from "@/components/iterations/editorial-primitives"
import { getIterationNav, SITE_TONE, workflowSteps } from "@/lib/iteration-ui"
import { HELP_DOCS } from "@/lib/help-docs"
import type { ActiveDeck } from "@/lib/deck-model"
import { loadMostRecentActiveDeck } from "@/lib/deck-storage"
import { listManualWords, type ManualWord } from "@/lib/manual-words"

const VISITED_KEY = "totoneru.has_visited"

const trustSections = [
  {
    icon: Monitor,
    title: "Everything runs in your browser",
    body: "Your deck never leaves your machine. Web Workers parse .apkg files, IndexedDB stores backups, and sql.js reads the collection database locally.",
  },
  {
    icon: Database,
    title: "Auto-backup on every import",
    body: "The original archive is saved before parsing starts. You can download the untouched original from Export at any time.",
  },
  {
    icon: Eye,
    title: "Dry-run before bulk changes",
    body: "Run a sample dry-run first, inspect field diffs, then apply only when the result looks right.",
  },
  {
    icon: KeyRound,
    title: "Bring your own API key",
    body: "AI calls go directly from your browser to your selected provider. Keys are stored in your browser, not on a totoneru server.",
  },
  {
    icon: Lock,
    title: "No account or cloud deck storage",
    body: "There is no login in the MVP, and deck files are never uploaded to a totoneru backend.",
  },
  {
    icon: ShieldCheck,
    title: "Transactional exports",
    body: "Changes are staged first. Export reopens the original backup and writes only a downloaded copy.",
  },
  {
    icon: Workflow,
    title: "Open, inspectable pipeline",
    body: "Parsing, mapping, transformations, batching, and export all live in the codebase for review.",
  },
]

const flowSteps = [
  "Drop or choose .apkg",
  "Backup original locally",
  "Parse notes and media",
  "Map fields and templates",
  "Preview transformed cards",
  "Run dry-run",
  "Apply staged changes",
  "Download exported files",
]

export function IterationLanding({
  forceIntro = false,
}: {
  forceIntro?: boolean
}) {
  const [mode, setMode] = useState<"loading" | "intro" | "workspace">(
    forceIntro ? "intro" : "loading"
  )

  useEffect(() => {
    if (forceIntro) return

    const timeoutId = window.setTimeout(() => {
      const hasVisited = window.localStorage.getItem(VISITED_KEY) === "true"
      if (hasVisited) {
        setMode("workspace")
        return
      }

      window.localStorage.setItem(VISITED_KEY, "true")
      setMode("intro")
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [forceIntro])

  if (mode === "loading") {
    return (
      <section className="border-b-2 border-black px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-[1500px] border-2 border-black p-6">
          <p className="font-mono text-[11px] font-bold tracking-[0.12em] text-[#757575] uppercase">
            Loading
          </p>
          <p className="mt-2 text-[28px] leading-none font-black">
            Preparing your workspace.
          </p>
        </div>
      </section>
    )
  }

  if (mode === "workspace") {
    return <WorkspaceStart />
  }

  return <MarketingIntro />
}

function MarketingIntro() {
  const nav = getIterationNav().filter((item) => item.key !== "home")

  return (
    <>
      <section className="relative overflow-hidden border-b-2 border-black bg-white px-4 py-8 text-black sm:px-6 lg:py-12">
        <div className="relative mx-auto grid max-w-[1500px] gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          <div className="flex flex-col justify-between border-2 border-black bg-white p-5 sm:p-7">
            <div>
              <p className="iteration-stamp inline-block border-2 border-black bg-black px-3 py-2 font-mono text-[12px] font-bold tracking-[0.12em] text-white uppercase">
                Client-side Anki toolkit
              </p>
              <h1 className="mt-5 max-w-4xl text-[52px] leading-[0.87] font-black tracking-[-0.045em] sm:text-[78px] lg:text-[104px]">
                Import decks.
                <br />
                Export clean cards.
              </h1>
              <p className="mt-5 max-w-xl text-[18px] leading-[1.45] sm:text-[21px]">
                Import any Anki deck, transform it with AI or manual edits, and
                export a clean .apkg. Everything stays in your browser.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/import" onClick={markVisited}>
                <InkButton>Import .apkg</InkButton>
              </Link>
              <Link href="/add-cards" onClick={markVisited}>
                <InkButton className="bg-black text-white hover:bg-white hover:text-black">
                  Create cards
                </InkButton>
              </Link>
            </div>
            <DocumentationPanel item={HELP_DOCS["/"].items[0]} />
          </div>

          <div className="grid gap-4">
            <div className="grid min-h-[210px] overflow-hidden border-2 border-black bg-black text-white md:grid-cols-[1fr_240px]">
              <div className="p-5">
                <p className="font-mono text-[11px] font-bold tracking-[0.12em] text-white/70 uppercase">
                  Current workspace
                </p>
                <p className="mt-3 text-[44px] leading-[0.9] font-black tracking-[-0.03em]">
                  No deck loaded yet.
                </p>
                <p className="mt-4 max-w-lg text-[15px] leading-[1.45] text-white/75">
                  Start with an .apkg import, or create manual cards and export
                  them as a new deck.
                </p>
              </div>
              <div className="border-t-2 border-white p-5 font-mono text-[12px] tracking-[0.1em] text-white/75 uppercase md:border-t-0 md:border-l-2">
                <div className="border-b-2 border-white pb-3">
                  <p className="text-white">Deck</p>
                  <p>Not imported</p>
                </div>
                <div className="pt-3">
                  <p className="text-white">Manual cards</p>
                  <p>Create any time</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {workflowSteps.map((step, index) => {
                const Icon = step.icon
                return (
                  <Link
                    key={step.title}
                    href={nav[Math.min(index, nav.length - 1)]?.href ?? "/"}
                    onClick={markVisited}
                    className="group min-h-40 border-2 border-black bg-white p-4 transition-transform hover:-translate-y-1 hover:bg-black hover:text-white"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Icon className="size-5" />
                      <span className="font-mono text-[26px] font-black">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <p className="mt-8 font-mono text-[11px] font-bold tracking-[0.12em] text-[#757575] uppercase group-hover:text-white/70">
                      {step.kicker}
                    </p>
                    <h2 className="mt-1 text-[25px] leading-none font-black">
                      {step.title}
                    </h2>
                    <p className="mt-2 text-[13px] leading-[1.35]">
                      {step.body}
                    </p>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <HowItWorksInline />

      <footer className="border-t-2 border-black bg-[#1a1a1a] px-4 py-8 text-white sm:px-6">
        <div className="mx-auto grid max-w-[1500px] gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-[38px] leading-none font-black tracking-[-0.03em]">
              totoneru
            </p>
            <p className="mt-2 max-w-xl text-[14px] leading-[1.5] text-white/70">
              {SITE_TONE.footerNote}
            </p>
          </div>
          <div className="border-2 border-white p-4 font-mono text-[12px] tracking-[0.12em] uppercase">
            Open source. Client-side only. Your deck never leaves your browser.
          </div>
        </div>
      </footer>
    </>
  )
}

function HowItWorksInline() {
  return (
    <section
      id="how-it-works"
      className="border-b-2 border-black bg-white px-4 py-10 text-black sm:px-6 lg:py-14"
    >
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 border-b-2 border-black pb-6">
          <p className="font-mono text-[11px] font-bold tracking-[0.12em] text-[#757575] uppercase">
            How it works
          </p>
          <h2 className="mt-2 text-[42px] leading-none font-black tracking-[-0.03em] sm:text-[60px]">
            Local-first deck editing.
          </h2>
          <p className="mt-4 max-w-2xl text-[18px] leading-[1.5] text-[#4a4a4a]">
            Totoneru backs up your original deck, stages every change, and only
            writes a new downloaded file when you export.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-3 sm:grid-cols-2">
            {trustSections.map((section, index) => {
              const Icon = section.icon
              return (
                <article
                  key={section.title}
                  className="border-2 border-black bg-white p-5"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <p className="font-mono text-[11px] font-bold tracking-[0.08em] text-[#757575] uppercase">
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <h3 className="mt-1 text-[20px] leading-none font-black">
                        {section.title}
                      </h3>
                      <p className="mt-3 text-[14px] leading-[1.45] text-[#4a4a4a]">
                        {section.body}
                      </p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="border-2 border-black bg-black p-5 text-white">
            <p className="font-mono text-[11px] font-bold tracking-[0.12em] text-white/70 uppercase">
              Workflow
            </p>
            <div className="mt-5 grid gap-2">
              {flowSteps.map((step, index) => (
                <div
                  key={step}
                  className="grid grid-cols-[48px_1fr] items-center border-2 border-white"
                >
                  <span className="flex h-full min-h-12 items-center justify-center border-r-2 border-white font-mono text-[12px] font-bold">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="px-3 py-2 text-[14px] leading-[1.3] font-bold">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function WorkspaceStart() {
  const [activeDeck, setActiveDeck] = useState<ActiveDeck | null>(null)
  const [manualWords, setManualWords] = useState<ManualWord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([loadMostRecentActiveDeck(), listManualWords()]).then(
      ([deck, words]) => {
        setActiveDeck(deck ?? null)
        setManualWords(words)
        setIsLoading(false)
      }
    )
  }, [])

  return (
    <section className="border-b-2 border-black bg-white px-4 py-8 text-black sm:px-6 lg:py-12">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b-2 border-black pb-6">
          <div>
            <p className="font-mono text-[11px] font-bold tracking-[0.12em] text-[#757575] uppercase">
              Workspace
            </p>
            <h1 className="mt-2 text-[44px] leading-none font-black tracking-[-0.03em] sm:text-[64px]">
              Add a deck or create cards.
            </h1>
            <p className="mt-4 max-w-2xl text-[18px] leading-[1.5] text-[#4a4a4a]">
              Import an Anki package, create manual cards from scratch, or keep
              working from your saved browser workspace.
            </p>
          </div>
          <Link
            href="/?intro=1"
            className="inline-flex min-h-11 items-center justify-center border-2 border-black px-4 py-2 text-[14px] font-bold transition-colors hover:bg-black hover:text-white"
          >
            View intro
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <StartPanel
            eyebrow="Import deck"
            title={activeDeck ? activeDeck.fileName : "Start with an .apkg"}
            body={
              activeDeck
                ? `${activeDeck.deck.noteCount} notes loaded. Import a new deck or continue from the existing one.`
                : "Upload a modern Anki package. Totoneru backs up the original before parsing."
            }
            statLabel="Deck notes"
            statValue={
              isLoading
                ? "..."
                : activeDeck
                  ? String(activeDeck.deck.noteCount)
                  : "0"
            }
            href="/import"
            action="Import deck"
          />
          <StartPanel
            eyebrow="Create cards"
            title="Build cards manually"
            body="Add Japanese expressions, fill fields yourself or with AI, then export as a standalone deck or merge into an imported deck."
            statLabel="Manual cards"
            statValue={isLoading ? "..." : String(manualWords.length)}
            href="/add-cards"
            action="Create cards"
            dark
          />
        </div>
      </div>
    </section>
  )
}

function StartPanel({
  eyebrow,
  title,
  body,
  statLabel,
  statValue,
  href,
  action,
  dark = false,
}: {
  eyebrow: string
  title: string
  body: string
  statLabel: string
  statValue: string
  href: string
  action: string
  dark?: boolean
}) {
  return (
    <Link
      href={href}
      className={`min-h-72 border-2 border-black p-6 transition-transform hover:-translate-y-1 ${
        dark
          ? "bg-black text-white"
          : "bg-white text-black hover:bg-black hover:text-white"
      }`}
    >
      <p
        className={`font-mono text-[11px] font-bold tracking-[0.12em] uppercase ${
          dark ? "text-white/70" : "text-[#757575]"
        }`}
      >
        {eyebrow}
      </p>
      <h2 className="mt-3 text-[36px] leading-none font-black tracking-[-0.02em]">
        {title}
      </h2>
      <p
        className={`mt-4 text-[16px] leading-[1.5] ${dark ? "text-white/75" : ""}`}
      >
        {body}
      </p>
      <div
        className={`mt-8 grid grid-cols-[1fr_auto] items-end gap-4 border-t-2 pt-4 ${
          dark ? "border-white" : "border-black"
        }`}
      >
        <div>
          <p className="font-mono text-[11px] font-bold tracking-[0.12em] uppercase opacity-70">
            {statLabel}
          </p>
          <p className="mt-1 font-mono text-[30px] font-black">{statValue}</p>
        </div>
        <span
          className={`border-2 px-4 py-2 text-[14px] font-bold ${
            dark ? "border-white" : "border-black"
          }`}
        >
          {action}
        </span>
      </div>
    </Link>
  )
}

function markVisited() {
  window.localStorage.setItem(VISITED_KEY, "true")
}
