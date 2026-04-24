import { Check, Circle, Database, Eye, ShieldCheck } from "lucide-react"
import Link from "next/link"

import { ApkgImportProbe } from "@/components/apkg-import-probe"
import { OnboardingOverlay } from "@/components/onboarding-overlay"
import { ThemeToggle } from "@/components/theme-toggle"

const workflowSteps = [
  {
    name: "Import",
    status: "Built",
    current: false,
  },
  {
    name: "Parse",
    status: "Built",
    current: false,
  },
  {
    name: "Map",
    status: "Active",
    current: true,
  },
  {
    name: "Export",
    status: "Next",
    current: false,
  },
]

const safeguards = [
  {
    label: "Local-only deck handling",
    icon: Database,
  },
  {
    label: "Side-by-side dry run",
    icon: Eye,
  },
  {
    label: "Backups before changes",
    icon: ShieldCheck,
  },
]

export default function Page() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:mx-4 focus:mt-4 focus:rounded-[8px] focus:bg-foreground focus:px-4 focus:py-2 focus:text-background"
      >
        Skip to content
      </a>
      <OnboardingOverlay />

      <header className="border-b border-border bg-background/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[17px] font-semibold tracking-tight">totoneru</p>
              <p className="text-[13px] text-muted-foreground">Local Anki deck workspace</p>
            </div>
            <nav className="hidden sm:flex items-center gap-1">
              <Link
                href="/how-it-works"
                className="rounded-full px-3 py-1.5 text-[14px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                How it works
              </Link>
              <Link
                href="/shortcuts"
                className="rounded-full px-3 py-1.5 text-[14px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Shortcuts
              </Link>
            </nav>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-6xl px-5 py-7 sm:px-6 sm:py-10">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Phase 3 active
            </p>
            <h1 className="text-balance text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[44px]">
              Map, template, preview.
            </h1>
          </div>
          <div className="rounded-lg border border-border bg-card px-3 py-2 text-[13px] text-muted-foreground">
            No account. No server copy. No writes without confirmation.
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">
            <ApkgImportProbe />
          </div>

          <aside className="space-y-4">
            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-[14px] font-semibold">Pipeline</h2>
              <div className="mt-4 space-y-3">
                {workflowSteps.map((step) => {
                  const Icon = step.current ? Circle : Check

                  return (
                    <div key={step.name} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Icon
                          className={
                            step.current
                              ? "size-3 fill-foreground text-foreground"
                              : "size-3 text-muted-foreground"
                          }
                        />
                        <span className="text-[14px]">{step.name}</span>
                      </div>
                      <span className="text-[12px] text-muted-foreground">{step.status}</span>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-[14px] font-semibold">Guardrails</h2>
              <div className="mt-4 space-y-3">
                {safeguards.map(({ label, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-2 text-[14px] text-muted-foreground">
                    <Icon className="size-4 text-foreground" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  )
}
