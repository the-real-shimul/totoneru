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

export type IterationPageKey =
  | "home"
  | "import"
  | "add"
  | "ai"
  | "batch"
  | "export"

export type IterationNavItem = {
  key: IterationPageKey
  label: string
  href: string
  icon: LucideIcon
}

export const SITE_TONE: SiteTone = {
  name: "totoneru",
  eyebrow: "Client-side Anki tools",
  headline: "Clean, expand, and export Anki decks in your browser.",
  deck: "For Japanese learners who want safer deck cleanup, manual card creation, and optional AI transforms without server-side deck storage.",
  footerNote:
    "Open source, client-side only, and built around dry-runs before bulk changes.",
}

export function getIterationNav(base = ""): IterationNavItem[] {
  return [
    { key: "home", label: "Home", href: base || "/", icon: LibraryBig },
    { key: "import", label: "Import", href: `${base}/import`, icon: Upload },
    {
      key: "add",
      label: "Add Cards",
      href: `${base}/add-cards`,
      icon: FilePlus2,
    },
    { key: "ai", label: "AI", href: `${base}/ai`, icon: Bot },
    { key: "batch", label: "Batch", href: `${base}/batch`, icon: Boxes },
    { key: "export", label: "Export", href: `${base}/export`, icon: Download },
  ]
}

export const workflowSteps = [
  {
    title: "Import",
    kicker: "Deck import",
    body: "Drop a modern .apkg. The original is backed up before parsing starts.",
    icon: FileArchive,
  },
  {
    title: "Add Cards",
    kicker: "Manual cards",
    body: "Create cards directly, then export them alone or include them with an imported deck.",
    icon: FilePlus2,
  },
  {
    title: "Transform",
    kicker: "Optional AI",
    body: "Clean fields, generate furigana, or run BYO-key prompts against mapped fields.",
    icon: Sparkles,
  },
  {
    title: "Batch",
    kicker: "Dry-run first",
    body: "Preview staged changes before applying them across the deck.",
    icon: ScanLine,
  },
]

export const exportFormats = [
  {
    label: "Transformed APKG",
    detail:
      "Modern collection.anki21b package copied from the original backup.",
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
