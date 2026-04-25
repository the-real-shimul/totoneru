import { IterationLanding } from "@/components/iterations/iteration-landing"
import { IterationShell } from "@/components/iterations/iteration-shell"

export const metadata = {
  title: "Iteration B — totoneru",
  description: "Kinetic lab UI iteration for totoneru.",
}

export default function IterationBPage() {
  return (
    <IterationShell iteration="b" active="home">
      <IterationLanding iteration="b" />
    </IterationShell>
  )
}
