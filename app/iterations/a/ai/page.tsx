import { IterationShell } from "@/components/iterations/iteration-shell"
import { AiToolPage } from "@/components/iterations/tool-pages"

export const metadata = {
  title: "AI Transformation — Iteration A",
}

export default function IterationAAiPage() {
  return (
    <IterationShell iteration="a" active="ai">
      <AiToolPage />
    </IterationShell>
  )
}
