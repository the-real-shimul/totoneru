import {
  Bot,
  Boxes,
  Download,
  FileArchive,
  FilePlus2,
  LibraryBig,
  ScanLine,
  Sparkles,
  Upload,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type SiteTone = {
  name: string
  eyebrow: string
  headline: string
  deck: string
  footerNote: string
}

export type IterationPageKey = "home" | "import" | "add" | "ai" | "batch" | "export"

export type IterationNavItem = {
  key: IterationPageKey
  label: string
  href: string
  icon: LucideIcon
}

export const SITE_TONE: SiteTone = {
  name: "Kinetic lab",
  eyebrow: "Kinetic lab",
  headline: "A tiny newspaper machine for unruly flashcards.",
  deck:
    "For Japanese learners who obsess over cards. Manually build, AI-transform, or import decks of Anki flashcards entirely in your browser.",
  footerNote:
    "totoneru is playful, but the data rules stay boring: no server deck storage, no surprise writes.",
}

export function getIterationNav(base = ""): IterationNavItem[] {
  return [
    { key: "home", label: "Front Page", href: base || "/", icon: LibraryBig },
    { key: "import", label: "Import", href: `${base}/import`, icon: Upload },
    { key: "add", label: "Add Cards", href: `${base}/add-cards`, icon: FilePlus2 },
    { key: "ai", label: "AI", href: `${base}/ai`, icon: Bot },
    { key: "batch", label: "Batch", href: `${base}/batch`, icon: Boxes },
    { key: "export", label: "Export", href: `${base}/export`, icon: Download },
  ]
}

export const workflowSteps = [
  {
    title: "Import",
    kicker: "LOCAL READ",
    body: "Drop a modern .apkg. The original is backed up before parsing starts.",
    icon: FileArchive,
  },
  {
    title: "Map + Add",
    kicker: "NEW CARDS",
    body: "Create cards directly, then target standalone export, deck merge, or both.",
    icon: FilePlus2,
  },
  {
    title: "Transform",
    kicker: "AI OPTIONAL",
    body: "Clean fields, generate furigana, or run BYO-key prompts against mapped fields.",
    icon: Sparkles,
  },
  {
    title: "Batch + Export",
    kicker: "DRY RUN FIRST",
    body: "Review staged changes, then export APKG, CSV, or TSV without mutating the backup.",
    icon: ScanLine,
  },
]

export const exportFormats = [
  {
    label: "Transformed APKG",
    detail: "Modern collection.anki21b package copied from the original backup.",
  },
  {
    label: "Standalone APKG",
    detail: "New Anki package built from manually created cards.",
  },
  {
    label: "UTF-8 CSV",
    detail: "Header row plus quoted fields for Anki's text importer.",
  },
  {
    label: "UTF-8 TSV",
    detail: "Tab-separated export for simpler spreadsheet and Anki imports.",
  },
]
