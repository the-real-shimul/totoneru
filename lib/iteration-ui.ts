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

export type IterationId = "a" | "b"

export type IterationTone = {
  id: IterationId
  name: string
  eyebrow: string
  headline: string
  deck: string
  footerNote: string
  silly: boolean
}

export type IterationPageKey = "home" | "import" | "add" | "ai" | "batch" | "export"

export type IterationNavItem = {
  key: IterationPageKey
  label: string
  href: string
  icon: LucideIcon
}

export const ITERATIONS: Record<IterationId, IterationTone> = {
  a: {
    id: "a",
    name: "Iteration A",
    eyebrow: "Strict editorial",
    headline: "Anki deck surgery, set like front-page news.",
    deck:
      "A restrained WIRED-inspired pass: sharp rules, dense sections, square controls, and motion that behaves like a printing press.",
    footerNote:
      "Iteration A keeps the product sober: deck trust, local processing, and export confidence come first.",
    silly: false,
  },
  b: {
    id: "b",
    name: "Iteration B",
    eyebrow: "Kinetic lab",
    headline: "A tiny newspaper machine for unruly flashcards.",
    deck:
      "Same local-first workflow, but the interface lets type strips wiggle, stamps smack, and cards march through the machine.",
    footerNote:
      "Iteration B is playful, but the data rules stay boring: no server deck storage, no surprise writes.",
    silly: true,
  },
}

export function getIterationNav(
  iteration: IterationId,
  base = `/iterations/${iteration}`
): IterationNavItem[] {
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
