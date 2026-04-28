import { IterationShell } from "@/components/iterations/iteration-shell"
import { AiToolPage } from "@/components/iterations/tool-pages"

export const metadata = {
  title: "AI - totoneru",
}

export default function AiPage() {
  return (
    <IterationShell active="ai">
      <AiToolPage />
    </IterationShell>
  )
}
