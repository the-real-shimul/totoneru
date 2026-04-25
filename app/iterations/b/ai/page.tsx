import { IterationShell } from "@/components/iterations/iteration-shell"
import { AiToolPage } from "@/components/iterations/tool-pages"

export const metadata = {
  title: "AI Transformation — Iteration B",
}

export default function IterationBAiPage() {
  return (
    <IterationShell iteration="b" active="ai">
      <AiToolPage iteration="b" />
    </IterationShell>
  )
}
