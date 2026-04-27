import { IterationShell } from "@/components/iterations/iteration-shell"
import { ExportToolPage } from "@/components/iterations/tool-pages"

export const metadata = {
  title: "Export Options — totoneru",
}

export default function ExportPage() {
  return (
    <IterationShell active="export">
      <ExportToolPage />
    </IterationShell>
  )
}
