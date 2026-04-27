import Link from "next/link"

import { DocumentationPanel } from "@/components/iterations/documentation-toggle"
import { InkButton } from "@/components/iterations/editorial-primitives"
import { getIterationNav, SITE_TONE, workflowSteps } from "@/lib/iteration-ui"
import { HELP_DOCS } from "@/lib/help-docs"

export function IterationLanding() {
  const nav = getIterationNav().filter((item) => item.key !== "home")

  return (
    <>
      <section className="relative overflow-hidden border-b-2 border-black bg-white px-4 py-8 text-black sm:px-6 lg:py-12">
        <div className="relative mx-auto grid max-w-[1500px] gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          <div className="flex flex-col justify-between border-2 border-black bg-white p-5 sm:p-7">
            <div>
              <p className="iteration-stamp inline-block rotate-[-2deg] border-2 border-black bg-black px-3 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-white">
                Kinetic lab edition
              </p>
              <h1 className="mt-5 max-w-4xl text-[52px] font-black leading-[0.87] tracking-[-0.045em] sm:text-[78px] lg:text-[104px]">
                Import decks.
                <br />
                Export clean cards.
              </h1>
              <p className="mt-5 max-w-xl text-[18px] leading-[1.45] sm:text-[21px]">
                Import any Anki deck, transform it with AI or manual edits, and export a clean
                .apkg. Everything stays in your browser.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/import">
                <InkButton className="rotate-[-1deg]">Import .apkg</InkButton>
              </Link>
              <Link href="/add-cards">
                <InkButton className="rotate-[1deg] bg-black text-white hover:bg-white hover:text-black">
                  Create cards
                </InkButton>
              </Link>
            </div>
            <DocumentationPanel item={HELP_DOCS["/"].items[0]} />
          </div>

          <div className="grid gap-4">
            <div className="grid min-h-[210px] grid-cols-[1fr_96px] overflow-hidden border-2 border-black bg-black text-white">
              <div className="p-5">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-white/70">
                  Machine status
                </p>
                <p className="mt-3 text-[44px] font-black leading-[0.9] tracking-[-0.03em]">
                  Drop a deck. Watch it get reshaped.
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
                    href={nav[Math.min(index, nav.length - 1)]?.href ?? "/"}
                    className="group min-h-40 border-2 border-black bg-white p-4 transition-transform hover:-translate-y-1 hover:bg-black hover:text-white"
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

      <footer className="border-t-2 border-black bg-[#1a1a1a] px-4 py-8 text-white sm:px-6">
        <div className="mx-auto grid max-w-[1500px] gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-[38px] font-black leading-none tracking-[-0.03em]">totoneru factory</p>
            <p className="mt-2 max-w-xl text-[14px] leading-[1.5] text-white/70">
              {SITE_TONE.footerNote}
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
