import { IterationLanding } from "@/components/iterations/iteration-landing"
import { IterationShell } from "@/components/iterations/iteration-shell"

export default function Page() {
  return (
    <IterationShell iteration="b" active="home" basePath="">
      <IterationLanding iteration="b" basePath="" />
    </IterationShell>
  )
}
