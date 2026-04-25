import Link from "next/link"

import { DocumentationPanel } from "@/components/iterations/documentation-toggle"
import { InkButton } from "@/components/iterations/editorial-primitives"
import {
  getIterationNav,
  ITERATIONS,
  workflowSteps,
  type IterationId,
} from "@/lib/iteration-ui"
import { HELP_DOCS } from "@/lib/help-docs"
import { cn } from "@/lib/utils"

export function IterationLanding({
  iteration,
  basePath,
}: {
  iteration: IterationId
  basePath?: string
}) {
  const tone = ITERATIONS[iteration]
  const nav = getIterationNav(iteration, basePath).filter((item) => item.key !== "home")

  if (tone.silly) {
    return <KineticLanding iteration={iteration} basePath={basePath} />
  }

  return (
    <>
      <section className="mx-auto grid max-w-[1500px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:py-12">
        <div>
          <p className="font-mono text-[12px] font-bold uppercase tracking-[0.16em] text-[#757575]">
            {tone.eyebrow}
          </p>
          <h1 className="mt-3 max-w-5xl text-[48px] font-black leading-[0.98] tracking-[-0.035em] sm:text-[72px] lg:text-[92px]">
            {tone.headline}
          </h1>
          <p className="mt-5 max-w-2xl text-[18px] leading-[1.5] sm:text-[21px]">
            {tone.deck}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={`${basePath ?? `/iterations/${iteration}`}/import`}>
              <InkButton>Import a deck</InkButton>
            </Link>
            <Link href={`${basePath ?? `/iterations/${iteration}`}/add-cards`}>
              <InkButton className="bg-black text-white hover:bg-white hover:text-black">
                Add cards
              </InkButton>
            </Link>
          </div>
          <DocumentationPanel item={HELP_DOCS["/"].items[0]} />
        </div>

        <div className="border-2 border-black">
          <div className="border-b-2 border-black bg-black px-4 py-2 font-mono text-[12px] uppercase tracking-[0.14em] text-white">
            Today&apos;s workflow
          </div>
          <div className="divide-y-2 divide-black">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <div
                  key={step.title}
                  className={cn(
                    "grid grid-cols-[48px_1fr] gap-4 p-4",
                    tone.silly && "iteration-card-flow"
                  )}
                  style={tone.silly ? { animationDelay: `${index * 120}ms` } : undefined}
                >
                  <div className="font-mono text-[28px] font-black">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon className="size-4" />
                      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#757575]">
                        {step.kicker}
                      </p>
                    </div>
                    <h2 className="mt-1 text-[24px] font-black leading-none">
                      {step.title}
                    </h2>
                    <p className="mt-2 text-[14px] leading-[1.45]">{step.body}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-y-2 border-black bg-black text-white">
        <div className="mx-auto grid max-w-[1500px] divide-y-2 divide-white px-4 sm:px-6 md:grid-cols-5 md:divide-x-2 md:divide-y-0">
          {nav.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group min-h-40 p-4 transition-colors hover:bg-white hover:text-black"
              >
                <Icon className="size-5" />
                <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.12em] opacity-70">
                  Tool page
                </p>
                <h3 className="mt-1 text-[25px] font-black leading-none group-hover:text-[#057dbc]">
                  {item.label}
                </h3>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6">
        <div className="grid gap-6 border-t-2 border-black pt-6 lg:grid-cols-[0.8fr_1.2fr]">
          <h2 className="text-[38px] font-black leading-[1] tracking-[-0.02em]">
            Local-first rules, loud enough to read from the sidewalk.
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {["No server deck storage", "Auto-backup on import", "Dry-run before bulk apply"].map(
              (item) => (
                <div key={item} className="border-t-2 border-black pt-3">
                  <p className="font-mono text-[12px] font-bold uppercase tracking-[0.12em]">
                    {item}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      <footer className="border-t-2 border-black bg-[#1a1a1a] px-4 py-8 text-white sm:px-6">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[28px] font-black leading-none">totoneru</p>
            <p className="mt-2 max-w-xl text-[14px] leading-[1.5] text-white/70">
              {tone.footerNote}
            </p>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/70">
            APKG in, calmer cards out.
          </p>
        </div>
      </footer>
    </>
  )
}

function KineticLanding({
  iteration,
  basePath,
}: {
  iteration: IterationId
  basePath?: string
}) {
  const tone = ITERATIONS[iteration]
  const nav = getIterationNav(iteration, basePath).filter((item) => item.key !== "home")
  const base = basePath ?? `/iterations/${iteration}`

  return (
    <>
      <section className="relative overflow-hidden border-b-2 border-black bg-white px-4 py-8 text-black sm:px-6 lg:py-12">
        <div className="relative mx-auto grid max-w-[1500px] gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          <div className="flex flex-col justify-between border-2 border-black bg-white p-5 sm:p-7">
            <div>
              <p className="inline-block rotate-[-2deg] border-2 border-black bg-black px-3 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.16em] text-white iteration-stamp">
                Kinetic lab edition
              </p>
              <h1 className="mt-5 max-w-4xl text-[52px] font-black leading-[0.87] tracking-[-0.045em] sm:text-[78px] lg:text-[104px]">
                Cards go in.
                <br />
                Chaos gets typeset.
              </h1>
              <p className="mt-5 max-w-xl text-[18px] leading-[1.45] sm:text-[21px]">
                {tone.deck}
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`${base}/import`}>
                <InkButton className="rotate-[-1deg]">Feed the deck</InkButton>
              </Link>
              <Link href={`${base}/add-cards`}>
                <InkButton className="rotate-[1deg] bg-black text-white hover:bg-white hover:text-black">
                  Make fresh cards
                </InkButton>
              </Link>
            </div>
            <DocumentationPanel item={HELP_DOCS["/"].items[0]} />
          </div>

          <div className="grid gap-4">
            <div className="grid min-h-[210px] grid-cols-[1fr_96px] overflow-hidden border-2 border-black bg-black text-white">
              <div className="p-5">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
                  Machine status
                </p>
                <p className="mt-3 text-[44px] font-black leading-[0.9] tracking-[-0.03em]">
                  Furigana press is emotionally available.
                </p>
              </div>
              <div className="relative border-l-2 border-white">
                <div className="absolute inset-x-4 top-4 h-10 border-2 border-white bg-black iteration-card-shuttle" />
                <div className="absolute inset-x-4 top-20 h-10 border-2 border-white bg-white iteration-card-shuttle delay-150" />
                <div className="absolute inset-x-4 top-36 h-10 border-2 border-white bg-black iteration-card-shuttle delay-300" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {workflowSteps.map((step, index) => {
                const Icon = step.icon
                return (
                  <Link
                    key={step.title}
                    href={nav[Math.min(index, nav.length - 1)]?.href ?? base}
                    className={cn(
                      "group min-h-40 border-2 border-black bg-white p-4 transition-transform hover:-translate-y-1 hover:bg-black hover:text-white",
                      index % 2 === 0 ? "rotate-[-1deg]" : "rotate-[1deg]"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Icon className="size-5" />
                      <span className="font-mono text-[26px] font-black">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <p className="mt-8 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#757575] group-hover:text-white/70">
                      {step.kicker}
                    </p>
                    <h2 className="mt-1 text-[25px] font-black leading-none group-hover:text-[#057dbc]">
                      {step.title}
                    </h2>
                    <p className="mt-2 text-[13px] leading-[1.35]">{step.body}</p>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-b-2 border-black bg-white py-3 font-mono text-[42px] font-black uppercase leading-none tracking-[-0.04em] text-black sm:text-[72px]">
        <div className="iteration-marquee whitespace-nowrap">
          IMPORT / ADD / AI / BATCH / EXPORT / IMPORT / ADD / AI / BATCH / EXPORT /
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-5">
          {nav.map((item, index) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "min-h-52 border-2 border-black bg-white p-4 transition-transform hover:-translate-y-1 hover:bg-black hover:text-white",
                  index % 2 === 0 ? "lg:mt-8" : "lg:mb-8"
                )}
              >
                <Icon className="size-5" />
                <p className="mt-16 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#757575]">
                  Factory station
                </p>
                <h3 className="mt-1 text-[27px] font-black leading-none">{item.label}</h3>
              </Link>
            )
          })}
        </div>
      </section>

      <footer className="border-t-2 border-black bg-[#1a1a1a] px-4 py-8 text-white sm:px-6">
        <div className="mx-auto grid max-w-[1500px] gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-[38px] font-black leading-none tracking-[-0.03em]">totoneru factory</p>
            <p className="mt-2 max-w-xl text-[14px] leading-[1.5] text-white/70">
              {tone.footerNote}
            </p>
          </div>
          <div className="border-2 border-white p-4 font-mono text-[12px] uppercase tracking-[0.12em]">
            No cloud deck storage. No surprise writes. The machine is loud, not reckless.
          </div>
        </div>
      </footer>
    </>
  )
}
