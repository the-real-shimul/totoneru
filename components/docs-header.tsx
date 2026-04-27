import { ArrowLeft, Bot, BookOpen, Keyboard, Upload } from "lucide-react"
import Link from "next/link"

const docsLinks = [
  { href: "/how-it-works", label: "How it works", icon: BookOpen },
  { href: "/prompts", label: "Prompts", icon: Bot },
  { href: "/shortcuts", label: "Shortcuts", icon: Keyboard },
]

export function DocsHeader() {
  return (
    <header className="border-b border-border bg-background/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Workspace
        </Link>
        <nav className="flex flex-wrap items-center gap-2">
          <Link
            href="/import"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Upload className="size-3.5" />
            Import
          </Link>
          {docsLinks.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon className="size-3.5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
