import { IterationShell } from "@/components/iterations/iteration-shell"
import { BatchToolPage } from "@/components/iterations/tool-pages"

export const metadata = {
  title: "Batch Editor — Iteration B",
}

export default function IterationBBatchPage() {
  return (
    <IterationShell iteration="b" active="batch">
      <BatchToolPage iteration="b" />
    </IterationShell>
  )
}
