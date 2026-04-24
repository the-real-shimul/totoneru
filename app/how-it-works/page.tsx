import { ArrowLeft, Database, Eye, KeyRound, Lock, Monitor, ShieldCheck, Workflow } from "lucide-react"
import Link from "next/link"

import { ThemeToggle } from "@/components/theme-toggle"

export const metadata = {
  title: "How it works — totoneru",
  description: "Learn how totoneru handles your Anki decks entirely in your browser.",
}

const sections = [
  {
    icon: Monitor,
    title: "Everything runs in your browser",
    body: "Your deck never leaves your machine. We use Web Workers to parse .apkg files, IndexedDB to store backups, and sql.js (SQLite compiled to WebAssembly) to read the collection database — all client-side. There is no server that processes your cards.",
  },
  {
    icon: Database,
    title: "Auto-backup on every import",
    body: "The moment you drop an .apkg file, the original archive is saved to your browser's IndexedDB before anything else happens. You can download the untouched original at any time from the Export panel. The backup stays until you explicitly clear it.",
  },
  {
    icon: Eye,
    title: "Dry-run before any bulk change",
    body: "Before applying transformations to your entire deck, you must run a dry-run on 5 sample cards. You see exactly what changes per card — field diffs, reordering, and AI-generated content. Bulk apply is blocked until you confirm the dry-run looks correct.",
  },
  {
    icon: KeyRound,
    title: "BYO API key",
    body: "AI features require your own API key. Keys are stored in your browser's IndexedDB and sent directly from your browser to your chosen provider (OpenAI, Anthropic, Groq, OpenRouter, etc.). They never pass through our servers.",
  },
  {
    icon: Lock,
    title: "No account, no tracking without consent",
    body: "There is no login, no account, and no cloud storage of your decks. Error tracking (Sentry) and analytics (PostHog) are production-only and opt-in. You choose on first visit; the choice is stored in localStorage, not cookies.",
  },
  {
    icon: ShieldCheck,
    title: "Transactional writes",
    body: "All changes are staged in memory and IndexedDB before you commit. You can abort mid-batch, retry only failed cards, or discard the entire staged state. The original SQLite database inside your .apkg is only modified during export, and only for notes that actually changed.",
  },
  {
    icon: Workflow,
    title: "Open source, inspectable pipeline",
    body: "Every step of the pipeline is in the repo: parsing, mapping, transformations, batching, and export. You can read the exact file where API calls originate, verify the export logic, and build from source yourself.",
  },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:mx-4 focus:mt-4 focus:rounded-[8px] focus:bg-foreground focus:px-4 focus:py-2 focus:text-background"
      >
        Skip to content
      </a>
      <header className="border-b border-border bg-background/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" />
              <span className="text-[13px]">Back</span>
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-16">
        <div className="mb-12">
          <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Trust
          </p>
          <h1 className="text-balance text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[44px]">
            How it works
          </h1>
          <p className="mt-4 max-w-xl text-[18px] leading-[1.55] text-[#4A4744]">
            Your deck never touches a server. Here is exactly what happens when you use totoneru.
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((section, index) => (
            <section
              key={section.title}
              className="rounded-[20px] border border-border bg-card p-8 shadow-[0_1px_3px_rgba(26,26,26,0.03)]"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
                  <section.icon className="size-5 text-foreground" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h2 className="text-[20px] font-medium text-foreground">
                      {section.title}
                    </h2>
                  </div>
                  <p className="mt-2 text-[15px] leading-[1.55] text-[#4A4744]">
                    {section.body}
                  </p>
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-[20px] border border-border bg-card p-8 shadow-[0_1px_3px_rgba(26,26,26,0.03)]">
          <h2 className="text-[20px] font-medium text-foreground mb-4">
            Data flow diagram
          </h2>
          <div className="rounded-[12px] border border-border bg-background/60 p-5 font-mono text-[13px] leading-[1.6] text-[#4A4744] overflow-x-auto">
            <pre className="whitespace-pre">
{`User drops .apkg
    |
    v
[Auto-backup to IndexedDB]
    |
    v
[Web Worker: jszip + sql.js]
    |
    v
[Parse notes, fields, templates, media]
    |
    v
[Heuristic field role detection]
    |
    v
[User edits mappings + selects template]
    |
    v
[Preview: original vs transformed]
    |
    v
[Dry-run on 5 sample cards]
    |
    v
[User confirms dry-run]
    |
    v
[Bulk batch with per-card error isolation]
    |
    v
[Stage all changes in IndexedDB]
    |
    v
[User clicks Export]
    |
    v
[Re-open original SQLite from backup]
    |
    v
[UPDATE only changed notes]
    |
    v
[Re-zip with original media]
    |
    v
[Verify by re-opening exported DB]
    |
    v
[Download transformed.apkg]`}
            </pre>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-[#1A1A1A] px-6 py-3 text-[15px] font-medium text-[#FAF7F2] shadow-[0_1px_2px_rgba(26,26,26,0.08)] transition-colors hover:bg-black"
          >
            Start using totoneru
          </Link>
        </div>
      </main>
    </div>
  )
}
