import { ArrowLeft, Keyboard } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Keyboard shortcuts — totoneru",
  description: "Keyboard shortcuts for totoneru.",
}

const shortcuts = [
  {
    keys: ["Tab"],
    description: "Move focus to next interactive element",
    context: "Global",
  },
  {
    keys: ["Shift", "Tab"],
    description: "Move focus to previous interactive element",
    context: "Global",
  },
  {
    keys: ["Enter"],
    description: "Activate button or link",
    context: "Global",
  },
  {
    keys: ["Space"],
    description: "Toggle checkbox or activate button",
    context: "Global",
  },
  {
    keys: ["Escape"],
    description: "Close modal dialogs (onboarding overlay)",
    context: "Global",
  },
  {
    keys: ["↑"],
    description: "Move block up in the block editor",
    context: "Block editor",
  },
  {
    keys: ["↓"],
    description: "Move block down in the block editor",
    context: "Block editor",
  },
]

export default function ShortcutsPage() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:mx-4 focus:mt-4 focus:rounded-[8px] focus:bg-foreground focus:px-4 focus:py-2 focus:text-background"
      >
        Skip to content
      </a>
      <header className="border-b border-border bg-background/90">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" />
              <span className="text-[13px]">Back</span>
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-16">
        <div className="mb-12">
          <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Reference
          </p>
          <h1 className="text-balance text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[44px]">
            Keyboard shortcuts
          </h1>
          <p className="mt-4 max-w-xl text-[18px] leading-[1.55] text-[#4A4744]">
            All shortcuts work without modifiers unless noted. Shortcuts are disabled while typing in form fields.
          </p>
        </div>

        <div className="space-y-2">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-start gap-4 rounded-[12px] border border-border bg-card px-5 py-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
                <Keyboard className="size-5 text-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {shortcut.keys.map((key, kidx) => (
                    <span key={kidx}>
                      <kbd className="rounded-[6px] border border-border bg-muted px-2 py-0.5 font-mono text-[12px] font-semibold text-foreground">
                        {key}
                      </kbd>
                      {kidx < shortcut.keys.length - 1 && (
                        <span className="mx-1 text-muted-foreground">+</span>
                      )}
                    </span>
                  ))}
                </div>
                <p className="mt-1 text-[15px] text-foreground">{shortcut.description}</p>
                <p className="text-[12px] text-muted-foreground">{shortcut.context}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-[20px] border border-border bg-card p-8 shadow-[0_1px_3px_rgba(26,26,26,0.03)]">
          <h2 className="text-[20px] font-medium text-foreground mb-4">
            Accessibility notes
          </h2>
          <div className="space-y-3 text-[15px] leading-[1.55] text-[#4A4744]">
            <p>
              All interactive elements in totoneru are reachable via keyboard. The app uses semantic HTML and ARIA attributes where native semantics are insufficient.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Modal dialogs trap focus and can be closed with Escape.</li>
              <li>Form labels are explicitly associated with their controls.</li>
              <li>Progress indicators expose their values to screen readers.</li>
              <li>Expandable sections announce their expanded/collapsed state.</li>
              <li>Color is never the sole means of conveying information.</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
