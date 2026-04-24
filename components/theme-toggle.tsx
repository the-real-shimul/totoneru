"use client"

import { MoonStar, SunMedium } from "lucide-react"
import { useTheme } from "next-themes"

import { useAnalytics } from "@/components/analytics-provider"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const { capture } = useAnalytics()
  const isDark = resolvedTheme === "dark"

  const handleToggle = () => {
    const nextTheme = isDark ? "light" : "dark"
    setTheme(nextTheme)
    capture("theme_changed", { theme: nextTheme })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={handleToggle}
      className="gap-2"
    >
      {isDark ? <SunMedium /> : <MoonStar />}
      <span>{isDark ? "Light mode" : "Dark mode"}</span>
    </Button>
  )
}
