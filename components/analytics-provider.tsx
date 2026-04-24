"use client"

import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react"
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react"

import {
  createBrowserStore,
  useBrowserStore,
} from "@/lib/browser-store"

const STORAGE_KEY = "totoneru_analytics_consent"
type AnalyticsProperties = Record<string, string | number | boolean | null>

type AnalyticsContextValue = {
  consented: boolean
  capture: (event: string, properties?: AnalyticsProperties) => void
}

const AnalyticsContext = createContext<AnalyticsContextValue>({
  consented: false,
  capture: () => {},
})

const consentStore = createBrowserStore<boolean | null>({
  key: STORAGE_KEY,
  parse: (raw) => {
    if (raw === "true") return true
    if (raw === "false") return false
    return null
  },
  serialize: (value) => (value === true ? "true" : value === false ? "false" : ""),
  defaultValue: null,
})

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const consented = useBrowserStore(consentStore)
  const prevConsented = useRef(consented)

  const analytics = {
    consented: consented === true,
    capture: (event: string, properties?: AnalyticsProperties) => {
      if (consented !== true) {
        return
      }

      posthog.capture(event, properties)
    },
  }

  useEffect(() => {
    if (
      consented &&
      process.env.NEXT_PUBLIC_POSTHOG_KEY &&
      process.env.NODE_ENV === "production"
    ) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "/ingest",
        ui_host: "https://us.posthog.com",
        defaults: "2026-01-30",
        capture_pageview: true,
        capture_exceptions: true,
        persistence: "localStorage",
      })
      if (prevConsented.current === null) {
        posthog.capture("analytics_consent_accepted")
      }
    }
    prevConsented.current = consented
  }, [consented])

  return (
    <AnalyticsContext.Provider value={analytics}>
      <PostHogProvider client={posthog}>
        {children}
        {consented === null && (
          <ConsentBanner
            onAccept={() => consentStore.set(true)}
            onDecline={() => consentStore.set(false)}
          />
        )}
      </PostHogProvider>
    </AnalyticsContext.Provider>
  )
}

export function useAnalytics() {
  return useContext(AnalyticsContext)
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
