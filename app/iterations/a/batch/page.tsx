import { IterationShell } from "@/components/iterations/iteration-shell"
import { BatchToolPage } from "@/components/iterations/tool-pages"

export const metadata = {
  title: "Batch Editor — Iteration A",
}

export default function IterationABatchPage() {
  return (
    <IterationShell iteration="a" active="batch">
      <BatchToolPage />
    </IterationShell>
  )
}
