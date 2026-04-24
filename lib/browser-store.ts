"use client"

import { useSyncExternalStore } from "react"

export type BrowserStore<T> = {
  get: () => T
  getServer: () => T
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
  let cachedRaw: string | null | undefined
  let cachedValue = defaultValue

  function get(): T {
    if (typeof window === "undefined") return defaultValue

    const raw = localStorage.getItem(key)
    if (raw === cachedRaw) {
      return cachedValue
    }

    cachedRaw = raw
    cachedValue = parse(raw)
    return cachedValue
  }

  function set(value: T) {
    if (typeof window === "undefined") return
    const raw = serialize(value)
    localStorage.setItem(key, raw)
    cachedRaw = raw
    cachedValue = value
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

  function getServer(): T {
    return defaultValue
  }

  return { get, getServer, set, subscribe }
}

export function useBrowserStore<T>(store: BrowserStore<T>): T {
  return useSyncExternalStore(
    store.subscribe,
    store.get,
    store.getServer
  )
}
