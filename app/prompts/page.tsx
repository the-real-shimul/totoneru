import { ArrowLeft, BookOpen } from "lucide-react"
import Link from "next/link"

import { ThemeToggle } from "@/components/theme-toggle"
import { CURATED_PROMPTS } from "@/lib/prompts"

export const metadata = {
  title: "Prompt cookbook — totoneru",
  description: "Curated AI prompts for transforming Anki decks.",
}

export default function PromptCookbookPage() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:mx-4 focus:mt-4 focus:rounded-[8px] focus:bg-foreground focus:px-4 focus:py-2 focus:text-background"
      >
        Skip to content
      </a>
      <header className="border-b border-border bg-background/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" />
              <span className="text-[13px]">Back</span>
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-16">
        <div className="mb-12">
          <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Documentation
          </p>
          <h1 className="text-balance text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[44px]">
            Prompt cookbook
          </h1>
          <p className="mt-4 max-w-xl text-[18px] leading-[1.55] text-[#4A4744]">
            Curated AI prompts you can use out of the box, or adapt for your own decks.
          </p>
        </div>

        <div className="space-y-8">
          {CURATED_PROMPTS.map((prompt, index) => (
            <section
              key={prompt.id}
              className="rounded-[20px] border border-border bg-card p-8 shadow-[0_1px_3px_rgba(26,26,26,0.03)]"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
                  <BookOpen className="size-5 text-foreground" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h2 className="text-[20px] font-medium text-foreground">
                      {prompt.name}
                    </h2>
                  </div>
                  <p className="mt-1 text-[14px] text-muted-foreground">
                    {prompt.description}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {prompt.systemMessage && (
                  <div>
                    <p className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                      System message
                    </p>
                    <div className="rounded-[8px] border border-border bg-background/60 px-4 py-3">
                      <p className="whitespace-pre-wrap text-[13px] text-foreground leading-[1.55]">
                        {prompt.systemMessage}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <p className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                    User message
                  </p>
                  <div className="rounded-[8px] border border-border bg-background/60 px-4 py-3">
                    <p className="whitespace-pre-wrap text-[13px] text-foreground leading-[1.55]">
                      {prompt.userMessage}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                    Variables
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {prompt.variables.map((v) => (
                      <span
                        key={v.name}
                        className="rounded-[6px] bg-muted px-2 py-0.5 font-mono text-[12px] text-muted-foreground"
                      >
                        {"{{"}{v.name}{"}}"} → {v.description}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-[20px] border border-border bg-card p-8 shadow-[0_1px_3px_rgba(26,26,26,0.03)]">
          <h2 className="text-[20px] font-medium text-foreground mb-4">
            Writing your own prompts
          </h2>
          <div className="space-y-3 text-[15px] leading-[1.55] text-[#4A4744]">
            <p>
              Custom prompts use the same {"{{"}variable{"}}"} syntax as the curated ones. Available variables correspond to detected field roles:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><code className="text-[13px] bg-muted px-1 py-0.5 rounded">{"{{expression}}"}</code> — the Japanese word or expression</li>
              <li><code className="text-[13px] bg-muted px-1 py-0.5 rounded">{"{{reading}}"}</code> — reading in kana</li>
              <li><code className="text-[13px] bg-muted px-1 py-0.5 rounded">{"{{meaning}}"}</code> — English meaning</li>
              <li><code className="text-[13px] bg-muted px-1 py-0.5 rounded">{"{{sentence}}"}</code> — example sentence</li>
              <li><code className="text-[13px] bg-muted px-1 py-0.5 rounded">{"{{translation}}"}</code> — sentence translation</li>
            </ul>
            <p>
              Keep system messages short and specific. The model works best when the task is narrow and the output format is explicit.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-[#1A1A1A] px-6 py-3 text-[15px] font-medium text-[#FAF7F2] shadow-[0_1px_2px_rgba(26,26,26,0.08)] transition-colors hover:bg-black"
          >
            Try these prompts
          </Link>
        </div>
      </main>
    </div>
  )
}
