import { DatabaseZap, Eye, Sparkles } from "lucide-react"

import { ApkgImportProbe } from "@/components/apkg-import-probe"
import { HomeCTAs } from "@/components/home-ctas"
import { ThemeToggle } from "@/components/theme-toggle"

const workflowSteps = [
  {
    name: "Import",
    description: "Bring in an Anki package and create an automatic local backup.",
  },
  {
    name: "Map",
    description: "Review suggested field roles and choose a starting template.",
  },
  {
    name: "Preview",
    description: "Dry-run changes side by side before anything touches the deck.",
  },
  {
    name: "Export",
    description: "Apply confirmed transformations and send a clean package back to Anki.",
  },
]

const promiseCards = [
  {
    title: "Local-first by design",
    description:
      "Deck data stays in the browser, and AI calls go directly to the provider you choose.",
    icon: DatabaseZap,
    aurora: "radial-gradient(circle at 30% 60%, rgba(255,217,168,0.35) 0%, transparent 65%)",
  },
  {
    title: "Preview before apply",
    description:
      "Every bulk change is staged, diffed, and confirmed before the canonical deck is touched.",
    icon: Eye,
    aurora: "radial-gradient(circle at 70% 40%, rgba(200,208,255,0.30) 0%, transparent 65%)",
  },
  {
    title: "Built for Japanese decks",
    description:
      "Furigana, template mapping, and controlled card behavior are part of the product shape from day one.",
    icon: Sparkles,
    aurora: "radial-gradient(circle at 50% 70%, rgba(255,217,168,0.22) 0%, transparent 65%)",
  },
]

export default function Page() {
  return (
    <>
      <div className="aurora-bg" aria-hidden="true" />

      <div className="relative z-10 min-h-svh">

        {/* Floating pill nav */}
        <div className="sticky top-5 z-20 px-6">
          <nav className="mx-auto flex max-w-5xl items-center justify-between gap-6 rounded-full border border-border bg-background px-5 py-2.5 shadow-[0_4px_16px_rgba(26,26,26,0.04),0_1px_3px_rgba(26,26,26,0.03)]">
            <span className="text-[18px] font-semibold tracking-tight text-foreground">
              totoneru
            </span>
            <div className="hidden items-center gap-1 md:flex">
              {workflowSteps.map((step) => (
                <span
                  key={step.name}
                  className="rounded-lg px-3 py-1.5 text-[15px] font-medium text-muted-foreground"
                >
                  {step.name}
                </span>
              ))}
            </div>
            <ThemeToggle />
          </nav>
        </div>

        {/* Hero */}
        <section className="mx-auto max-w-5xl px-6 pb-20 pt-24 text-center">
          <p className="mb-5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Local-first · Client-side · Open source
          </p>
          <h1 className="mx-auto max-w-[760px] text-balance text-[56px] font-semibold leading-[1.05] tracking-[-0.02em] text-foreground sm:text-[68px]">
            A calm workspace for reshaping Anki decks.
          </h1>
          <p className="mx-auto mt-6 max-w-[500px] text-[18px] leading-[1.55] text-[#4A4744]">
            Preview every change before it touches the deck. Deck data never leaves your browser.
          </p>
          <div className="mt-10 flex items-center justify-center">
            <HomeCTAs />
          </div>
        </section>

        {/* Promise cards */}
        <section className="mx-auto max-w-5xl px-6 pb-24">
          <div className="grid gap-5 md:grid-cols-3">
            {promiseCards.map(({ title, description, icon: Icon, aurora }) => (
              <article
                key={title}
                style={{ background: `${aurora}, #F4EFE7` }}
                className="rounded-[20px] border border-border p-10"
              >
                <div className="mb-6 inline-flex rounded-[10px] border border-border bg-background/60 p-2.5">
                  <Icon className="size-5 text-foreground" />
                </div>
                <h2 className="text-[20px] font-medium text-foreground">{title}</h2>
                <p className="mt-3 text-[16px] leading-[1.55] text-[#4A4744]">{description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Workflow */}
        <section className="mx-auto max-w-5xl px-6 pb-24">
          <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            How it works
          </p>
          <h2 className="mb-12 text-[40px] font-semibold leading-[1.1] tracking-[-0.01em] text-foreground">
            Four steps to a cleaner deck.
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {workflowSteps.map((step, index) => (
              <div
                key={step.name}
                className="rounded-[20px] border border-border bg-card p-8 shadow-[0_1px_3px_rgba(26,26,26,0.03)]"
              >
                <p className="mb-6 font-mono text-[28px] font-medium text-[#A39E96]">
                  0{index + 1}
                </p>
                <h3 className="text-[20px] font-medium text-foreground">{step.name}</h3>
                <p className="mt-2 text-[14px] leading-[1.5] text-[#4A4744]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Import tool */}
        <section className="mx-auto max-w-5xl px-6 pb-32">
          <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Try it now
          </p>
          <h2 className="mb-12 text-[40px] font-semibold leading-[1.1] tracking-[-0.01em] text-foreground">
            Import a deck.
          </h2>
          <ApkgImportProbe />
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-card/40">
          <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[15px] font-semibold text-foreground">totoneru</span>
            <p className="text-[14px] text-muted-foreground">
              Client-side only. Your decks never leave your browser.
            </p>
          </div>
        </footer>

      </div>
    </>
  )
}
