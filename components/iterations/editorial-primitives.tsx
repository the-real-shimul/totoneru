import { HELP_DOCS, type HelpDocItem } from "@/lib/help-docs"
import { cn } from "@/lib/utils"
import { DocumentationPanel } from "./documentation-toggle"

export function EditorialSection({
  eyebrow,
  title,
  children,
  doc,
  className,
}: {
  eyebrow: string
  title: string
  children: React.ReactNode
  doc?: HelpDocItem
  className?: string
}) {
  return (
    <section className={cn("border-t-2 border-black py-8", className)}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[12px] font-bold uppercase tracking-[0.14em] text-[#757575]">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-[28px] font-black leading-[1.02] tracking-[-0.02em] sm:text-[38px]">
            {title}
          </h2>
        </div>
      </div>
      {children}
      {doc && <DocumentationPanel item={doc} />}
    </section>
  )
}

export function InkButton({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-11 items-center justify-center border-2 border-black bg-white px-4 py-2 text-[14px] font-bold text-black transition-colors hover:bg-black hover:text-white",
        className
      )}
    >
      {children}
    </span>
  )
}

export function StatRule({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-black pt-3">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#757575]">
        {label}
      </p>
      <p className="mt-1 break-words font-mono text-[22px] font-black">{value}</p>
    </div>
  )
}

export function docFor(path: keyof typeof HELP_DOCS, id: string) {
  return HELP_DOCS[path].items.find((item) => item.id === id)
}
