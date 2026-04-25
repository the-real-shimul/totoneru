import { IterationShell } from "@/components/iterations/iteration-shell"
import { ExportToolPage } from "@/components/iterations/tool-pages"

export const metadata = {
  title: "Export Options — Iteration A",
}

export default function IterationAExportPage() {
  return (
    <IterationShell iteration="a" active="export">
      <ExportToolPage />
    </IterationShell>
  )
}
