import { IterationShell } from "@/components/iterations/iteration-shell"
import { ImportToolPage } from "@/components/iterations/tool-pages"

export const metadata = {
  title: "Import — Iteration B",
}

export default function IterationBImportPage() {
  return (
    <IterationShell iteration="b" active="import">
      <ImportToolPage iteration="b" />
    </IterationShell>
  )
}
