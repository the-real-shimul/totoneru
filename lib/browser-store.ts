"use client"

import { useSyncExternalStore } from "react"

export type BrowserStore<T> = {
  get: () => T
  set: (value: T) => void
  subscribe: (callback: () => void) => () => void
}

export function createBrowserStore<T>({
  key,
  parse,
  serialize,
  defaultValue,
}: {
  key: string
  parse: (raw: string | null) => T
  serialize: (value: T) => string
  defaultValue: T
}): BrowserStore<T> {
  const listeners = new Set<() => void>()

  function get(): T {
    if (typeof window === "undefined") return defaultValue
    return parse(localStorage.getItem(key))
  }

  function set(value: T) {
    if (typeof window === "undefined") return
    localStorage.setItem(key, serialize(value))
    listeners.forEach((cb) => cb())
  }

  function subscribe(callback: () => void) {
    listeners.add(callback)

    function onStorage(event: StorageEvent) {
      if (event.key === key) callback()
    }

    window.addEventListener("storage", onStorage)

    return () => {
      listeners.delete(callback)
      window.removeEventListener("storage", onStorage)
    }
  }

  return { get, set, subscribe }
}

export function useBrowserStore<T>(store: BrowserStore<T>): T {
  return useSyncExternalStore(
    store.subscribe,
    store.get,
    () => store.get()
  )
}
