import { IterationLanding } from "@/components/iterations/iteration-landing"
import { IterationShell } from "@/components/iterations/iteration-shell"

export const metadata = {
  title: "Iteration A — totoneru",
  description: "Strict editorial UI iteration for totoneru.",
}

export default function IterationAPage() {
  return (
    <IterationShell iteration="a" active="home">
      <IterationLanding iteration="a" />
    </IterationShell>
  )
}
