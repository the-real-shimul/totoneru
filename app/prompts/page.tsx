import { BookOpen } from "lucide-react"
import Link from "next/link"

import { IterationShell } from "@/components/iterations/iteration-shell"
import { CURATED_PROMPTS } from "@/lib/prompts"

export const metadata = {
  title: "Prompt library - totoneru",
  description: "Curated AI prompts for transforming Anki decks.",
}

export default function PromptCookbookPage() {
  return (
    <IterationShell docsActive="prompts" showHelpToggle={false}>
      <div className="px-4 py-8 text-black sm:px-6 sm:py-12">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-12">
            <p className="mb-2 font-mono text-[11px] font-bold tracking-[0.14em] text-[#757575] uppercase">
              Documentation
            </p>
            <h1 className="text-[44px] leading-none font-black tracking-[-0.03em] sm:text-[64px]">
              Prompt library
            </h1>
            <p className="mt-4 max-w-2xl text-[18px] leading-[1.5] text-[#4a4a4a]">
              Curated AI prompts you can use out of the box, or adapt for your
              own decks.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {CURATED_PROMPTS.map((prompt, index) => (
              <section
                key={prompt.id}
                className="border-2 border-black bg-white p-5"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black bg-white">
                    <BookOpen className="size-5 text-black" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold tracking-[0.06em] text-[#757575] uppercase">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h2 className="text-[20px] leading-none font-black text-black">
                        {prompt.name}
                      </h2>
                    </div>
                    <p className="mt-2 text-[14px] leading-[1.4] text-[#4a4a4a]">
                      {prompt.description}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {prompt.systemMessage && (
                    <details className="border-2 border-black bg-white px-4 py-3">
                      <summary className="cursor-pointer font-mono text-[11px] font-bold tracking-[0.06em] text-[#757575] uppercase">
                        System message ({lineCount(prompt.systemMessage)} lines)
                      </summary>
                      <p className="mt-3 text-[13px] leading-[1.55] whitespace-pre-wrap text-black">
                        {prompt.systemMessage}
                      </p>
                    </details>
                  )}

                  <div className="border-2 border-black bg-white px-4 py-3">
                    <p className="font-mono text-[11px] font-bold tracking-[0.06em] text-[#757575] uppercase">
                      User message
                    </p>
                    <p className="mt-2 line-clamp-5 text-[13px] leading-[1.55] whitespace-pre-wrap text-black">
                      {prompt.userMessage}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 font-mono text-[11px] font-bold tracking-[0.06em] text-[#757575] uppercase">
                      Variables
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {prompt.variables.map((v) => (
                        <span
                          key={v.name}
                          className="border border-black px-2 py-0.5 font-mono text-[12px] text-black"
                        >
                          {"{{"}
                          {v.name}
                          {"}}"}: {v.description}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 border-2 border-black bg-white p-6">
            <h2 className="mb-4 text-[28px] leading-none font-black">
              Writing your own prompts
            </h2>
            <div className="space-y-3 text-[15px] leading-[1.55] text-[#4a4a4a]">
              <p>
                Custom prompts use the same {"{{"}variable{"}}"} syntax as the
                curated ones. Available variables correspond to detected field
                roles:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <code className="border border-black px-1 py-0.5 text-[13px]">
                    {"{{expression}}"}
                  </code>{" "}
                  is the Japanese word or expression
                </li>
                <li>
                  <code className="border border-black px-1 py-0.5 text-[13px]">
                    {"{{reading}}"}
                  </code>{" "}
                  is the reading in kana
                </li>
                <li>
                  <code className="border border-black px-1 py-0.5 text-[13px]">
                    {"{{meaning}}"}
                  </code>{" "}
                  is the English meaning
                </li>
                <li>
                  <code className="border border-black px-1 py-0.5 text-[13px]">
                    {"{{sentence}}"}
                  </code>{" "}
                  is the example sentence
                </li>
                <li>
                  <code className="border border-black px-1 py-0.5 text-[13px]">
                    {"{{translation}}"}
                  </code>{" "}
                  is the sentence translation
                </li>
              </ul>
              <p>
                Keep system messages short and specific. The model works best
                when the task is narrow and the output format is explicit.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center border-2 border-black bg-black px-5 py-2 text-[15px] font-bold text-white transition-colors hover:bg-white hover:text-black"
            >
              Try these prompts
            </Link>
          </div>
        </div>
      </div>
    </IterationShell>
  )
}

function lineCount(value: string) {
  return value.trim().split(/\r?\n/).length
}
