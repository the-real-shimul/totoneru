"use client"

import { MoonStar } from "lucide-react"
import { useTheme } from "next-themes"

import { useAnalytics } from "@/components/analytics-provider"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const { capture } = useAnalytics()

  const handleToggle = () => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark"
    setTheme(nextTheme)
    capture("theme_changed", { theme: nextTheme })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label="Toggle color mode"
      onClick={handleToggle}
      className="gap-2"
    >
      <MoonStar />
      <span>Theme</span>
    </Button>
  )
}
