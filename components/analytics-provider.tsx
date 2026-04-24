"use client"

import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react"
import { useEffect, useState } from "react"

const STORAGE_KEY = "totoneru_analytics_consent"

function useAnalyticsConsent() {
  const [consented, setConsented] = useState<boolean | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    setConsented(stored === "true")
  }, [])

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "true")
    setConsented(true)
  }

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, "false")
    setConsented(false)
  }

  return { consented, accept, decline }
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { consented, accept, decline } = useAnalyticsConsent()

  useEffect(() => {
    if (
      consented &&
      process.env.NEXT_PUBLIC_POSTHOG_KEY &&
      process.env.NODE_ENV === "production"
    ) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
        capture_pageview: true,
        persistence: "localStorage",
      })
    }
  }, [consented])

  return (
    <PostHogProvider client={posthog}>
      {children}
      {consented === null && (
        <ConsentBanner onAccept={accept} onDecline={decline} />
      )}
    </PostHogProvider>
  )
}

function ConsentBanner({
  onAccept,
  onDecline,
}: {
  onAccept: () => void
  onDecline: () => void
}) {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-lg border border-border bg-card p-4 shadow-lg">
      <p className="text-sm text-muted-foreground">
        Help improve totoneru by sharing anonymous usage data. Your deck and API
        key never leave your device.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={onAccept}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Allow
        </button>
        <button
          onClick={onDecline}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
        >
          Decline
        </button>
      </div>
    </div>
  )
}
