import { IterationShell } from "@/components/iterations/iteration-shell"
import { AddCardsToolPage } from "@/components/iterations/tool-pages"

export const metadata = {
  title: "Add Cards — Iteration B",
}

export default function IterationBAddCardsPage() {
  return (
    <IterationShell iteration="b" active="add">
      <AddCardsToolPage iteration="b" />
    </IterationShell>
  )
}
