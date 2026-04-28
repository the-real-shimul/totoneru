import { redirect } from "next/navigation"

export const metadata = {
  title: "How it works - totoneru",
}

export default function HowItWorksPage() {
  redirect("/?intro=1#how-it-works")
}
