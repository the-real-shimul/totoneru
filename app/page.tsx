import { IterationLanding } from "@/components/iterations/iteration-landing"
import { IterationShell } from "@/components/iterations/iteration-shell"

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const forceIntro = params?.intro === "1"

  return (
    <IterationShell active="home">
      <IterationLanding forceIntro={forceIntro} />
    </IterationShell>
  )
}
