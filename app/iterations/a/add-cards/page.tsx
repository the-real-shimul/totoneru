import { IterationShell } from "@/components/iterations/iteration-shell"
import { AddCardsToolPage } from "@/components/iterations/tool-pages"

export const metadata = {
  title: "Add Cards — Iteration A",
}

export default function IterationAAddCardsPage() {
  return (
    <IterationShell iteration="a" active="add">
      <AddCardsToolPage />
    </IterationShell>
  )
}
