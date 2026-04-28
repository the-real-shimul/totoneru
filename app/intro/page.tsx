import { redirect } from "next/navigation"

export const metadata = {
  title: "Intro - totoneru",
}

export default function IntroPage() {
  redirect("/?intro=1")
}
