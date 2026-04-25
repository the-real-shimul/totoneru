import { IterationShell } from "@/components/iterations/iteration-shell"
import { ImportToolPage } from "@/components/iterations/tool-pages"

export const metadata = {
  title: "Import — Iteration A",
}

export default function IterationAImportPage() {
  return (
    <IterationShell iteration="a" active="import">
      <ImportToolPage />
    </IterationShell>
  )
}
