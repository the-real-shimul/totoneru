"use client"

import { BookOpen, X } from "lucide-react"
import { createContext, useContext, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import type { HelpDocItem } from "@/lib/help-docs"

type DocumentationContextValue = {
  enabled: boolean
  setEnabled: (enabled: boolean) => void
}

const DocumentationContext = createContext<DocumentationContextValue | null>(
  null
)

export function DocumentationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [enabled, setEnabled] = useState(false)
  const value = useMemo(() => ({ enabled, setEnabled }), [enabled])

  return (
    <DocumentationContext.Provider value={value}>
      {children}
    </DocumentationContext.Provider>
  )
}

export function useDocumentation() {
  const context = useContext(DocumentationContext)
  if (!context) {
    throw new Error(
      "useDocumentation must be used inside DocumentationProvider"
    )
  }
  return context
}

export function DocumentationToggle() {
  const { enabled, setEnabled } = useDocumentation()

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-pressed={enabled}
      onClick={() => setEnabled(!enabled)}
      className="rounded-none border-2 border-black bg-white text-black hover:bg-black hover:text-white"
    >
      {enabled ? <X /> : <BookOpen />}
      {enabled ? "Hide help" : "Help"}
    </Button>
  )
}

export function DocumentationPanel({ item }: { item: HelpDocItem }) {
  const { enabled } = useDocumentation()
  if (!enabled) return null

  return (
    <aside className="mt-4 border-2 border-black bg-white p-4 text-black">
      <p className="font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
        Help / {item.id}
      </p>
      <h3 className="mt-2 text-[18px] font-bold">{item.title}</h3>
      <dl className="mt-3 grid gap-3 text-[13px] leading-[1.45] sm:grid-cols-2">
        <DocLine label="Summary" value={item.summary} />
        <DocLine label="Data" value={item.data} />
        <DocLine label="Privacy" value={item.privacy} />
        <DocLine label="Prerequisites" value={item.prerequisites} />
        <DocLine label="Output" value={item.output} />
        <DocLine label="Failure cases" value={item.failures} />
      </dl>
    </aside>
  )
}

function DocLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] font-bold tracking-[0.12em] text-[#757575] uppercase">
        {label}
      </dt>
      <dd className="mt-1">{value}</dd>
    </div>
  )
}
