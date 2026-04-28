import { IterationShell } from "@/components/iterations/iteration-shell"
import { ImportToolPage } from "@/components/iterations/tool-pages"

export const metadata = {
  title: "Import - totoneru",
}

export default function ImportPage() {
  return (
    <IterationShell active="import">
      <ImportToolPage />
    </IterationShell>
  )
}
