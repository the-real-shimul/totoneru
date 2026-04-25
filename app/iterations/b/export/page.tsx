import { IterationShell } from "@/components/iterations/iteration-shell"
import { ExportToolPage } from "@/components/iterations/tool-pages"

export const metadata = {
  title: "Export Options — Iteration B",
}

export default function IterationBExportPage() {
  return (
    <IterationShell iteration="b" active="export">
      <ExportToolPage iteration="b" />
    </IterationShell>
  )
}
