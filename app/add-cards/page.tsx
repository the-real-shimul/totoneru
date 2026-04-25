import { IterationShell } from "@/components/iterations/iteration-shell"
import { AddCardsToolPage } from "@/components/iterations/tool-pages"

export const metadata = {
  title: "Add Cards — totoneru",
}

export default function AddCardsPage() {
  return (
    <IterationShell iteration="b" active="add" basePath="">
      <AddCardsToolPage iteration="b" />
    </IterationShell>
  )
}
