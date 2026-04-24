"use client"

import { ArrowRight } from "lucide-react"

import { useAnalytics } from "@/components/analytics-provider"
import { Button } from "@/components/ui/button"

export function HomeCTAs() {
  const { capture } = useAnalytics()

  return (
    <div className="flex flex-wrap gap-3">
      <Button size="lg" onClick={() => capture("import_deck_clicked")}>
        Import deck
        <ArrowRight />
      </Button>
      <Button
        variant="outline"
        size="lg"
        onClick={() => capture("architecture_viewed")}
      >
        View architecture
      </Button>
    </div>
  )
}
