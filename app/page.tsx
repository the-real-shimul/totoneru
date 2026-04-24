import { DatabaseZap, Eye, Sparkles } from "lucide-react"

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
  },
  {
    title: "Preview before apply",
    description:
      "Every bulk change is staged, diffed, and confirmed before the canonical deck is touched.",
    icon: Eye,
  },
  {
    title: "Built for Japanese decks",
    description:
      "Furigana, template mapping, and controlled card behavior are part of the product shape from day one.",
    icon: Sparkles,
  },
]

export default function Page() {
  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top,_color-mix(in_oklch,var(--color-primary)_12%,transparent),transparent_35%),linear-gradient(180deg,color-mix(in_oklch,var(--color-background)_92%,white_8%),var(--color-background))]">
      <header className="border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <div className="min-w-0">
            <div className="font-heading text-sm uppercase tracking-[0.28em] text-muted-foreground">
              totoneru
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Transform Anki decks locally, preview everything, then export with confidence.
            </p>
          </div>
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-6xl flex-wrap gap-2 px-6 pb-4">
          {workflowSteps.map((step, index) => (
            <div
              key={step.name}
              className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-sm text-muted-foreground"
            >
              <span className="font-medium text-foreground">{`0${index + 1}`}</span>{" "}
              {step.name}
            </div>
          ))}
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.9fr)]">
        <section className="space-y-8">
          <div className="space-y-5">
            <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
              Phase 0.3 app shell
            </p>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl leading-tight font-semibold text-balance sm:text-5xl">
                A calm workspace for reshaping decks without losing trust in the data.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Totoneru sits between import and export: backup first, preview changes,
                keep data local, and only commit once the transformed cards look right.
              </p>
            </div>
            <HomeCTAs />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {promiseCards.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm"
              >
                <div className="mb-4 inline-flex rounded-2xl border border-border/70 bg-background/80 p-2 text-foreground">
                  <Icon className="size-5" />
                </div>
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <aside className="rounded-[2rem] border border-border/70 bg-card/85 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
                Workflow
              </p>
              <h2 className="mt-2 text-2xl font-semibold">What the shell is holding space for</h2>
            </div>
            <div className="rounded-full border border-border/70 px-3 py-1 font-mono text-xs text-muted-foreground">
              press d
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {workflowSteps.map((step, index) => (
              <div
                key={step.name}
                className="rounded-2xl border border-border/60 bg-background/75 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {index + 1}
                  </div>
                  <h3 className="text-base font-semibold">{step.name}</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </main>

      <footer className="border-t border-border/70 bg-background/80">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Client-side only. No deck uploads. No API key proxy.</p>
          <p>Foundations in place for import, dry-run preview, and transactional apply.</p>
        </div>
      </footer>
    </div>
  )
}
