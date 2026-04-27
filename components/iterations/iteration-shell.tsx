import Link from "next/link"

import {
  DocumentationProvider,
  DocumentationToggle,
} from "@/components/iterations/documentation-toggle"
import { getIterationNav, type IterationPageKey } from "@/lib/iteration-ui"
import { cn } from "@/lib/utils"

export function IterationShell({
  active,
  children,
}: {
  active: IterationPageKey
  children: React.ReactNode
}) {
  const nav = getIterationNav()

  return (
    <DocumentationProvider>
      <div
        className={cn(
          "min-h-svh bg-white text-[#1a1a1a]",
          "iteration-silly"
        )}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:m-4 focus:border-2 focus:border-black focus:bg-white focus:px-4 focus:py-2 focus:text-black"
        >
          Skip to content
        </a>
        <header className="border-b-2 border-black bg-white text-black">
          <div className="mx-auto grid max-w-[1500px] gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
            <Link href="/" className="group">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#757575]">
                totoneru / kinetic lab
              </p>
              <p className="text-[26px] font-black leading-none tracking-[-0.02em] group-hover:text-[#057dbc]">
                TOTONERU
              </p>
            </Link>
            <nav className="flex flex-wrap items-center gap-1 lg:justify-center">
              {nav.map((item) => {
                const Icon = item.icon
                const selected = item.key === active
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-1 border-2 border-transparent px-3 py-2 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors hover:border-black hover:text-[#057dbc]",
                      selected && "border-black bg-black text-white"
                    )}
                  >
                    <Icon className="size-3.5" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <div className="flex items-center gap-2 lg:justify-end">
              <DocumentationToggle />
            </div>
          </div>
        </header>
        <main id="main-content">{children}</main>
      </div>
    </DocumentationProvider>
  )
}
