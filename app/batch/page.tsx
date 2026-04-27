import { IterationShell } from "@/components/iterations/iteration-shell"
import { BatchToolPage } from "@/components/iterations/tool-pages"

export const metadata = {
  title: "Batch Editor — totoneru",
}

export default function BatchPage() {
  return (
    <IterationShell active="batch">
      <BatchToolPage />
    </IterationShell>
  )
}
