"use client"

import { Eye, EyeOff, KeyRound, LoaderCircle, Plus, Trash2 } from "lucide-react"
import { useEffect, useId, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  deleteApiKey,
  loadApiKeys,
  saveApiKey,
  type StoredKey,
} from "@/lib/ai-keys"
import { AI_PROVIDERS, type AiProvider } from "@/lib/ai-types"

const PROVIDER_DEFAULTS: Record<
  AiProvider,
  { endpoint: string; model: string; label: string }
> = {
  openai: {
    endpoint: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini",
    label: "OpenAI-compatible key",
  },
  anthropic: {
    endpoint: "https://api.anthropic.com/v1/messages",
    model: "claude-3-5-haiku-latest",
    label: "Anthropic key",
  },
  groq: {
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.1-8b-instant",
    label: "Groq key",
  },
}

const PROVIDER_NAMES = Object.fromEntries(
  AI_PROVIDERS.map((provider) => [provider.id, provider.name])
) as Record<AiProvider, string>

export function AiSettings() {
  const [keys, setKeys] = useState<StoredKey[]>([])
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadApiKeys().then(setKeys)
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[16px] font-medium text-[#1a1a1a]">
            AI provider keys
          </p>
          <p className="text-[13px] text-[#757575]">
            Stored locally. Never sent to our servers.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowForm((s) => !s)}
        >
          {!showForm && <Plus />}
          {showForm ? "Cancel" : keys.length === 0 ? "Add key" : "Replace"}
        </Button>
      </div>

      {showForm && (
        <AddKeyForm
          onSaved={(key) => {
            setKeys((current) => [...current, key])
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {keys.length === 0 ? (
        <p className="text-[14px] text-[#757575]">
          No key saved. Add a provider key to enable AI features.
        </p>
      ) : (
        <div className="space-y-2">
          {keys.map((key) => (
            <KeyRow
              key={key.id}
              storedKey={key}
              onDelete={() =>
                deleteApiKey(key.id).then(() =>
                  setKeys((current) => current.filter((k) => k.id !== key.id))
                )
              }
            />
          ))}
        </div>
      )}

      <GroqKeyGuide />
    </div>
  )
}

function GroqKeyGuide() {
  return (
    <section className="border-2 border-black bg-white p-4">
      <p className="font-mono text-[11px] font-bold tracking-[0.12em] text-[#757575] uppercase">
        Free Groq key
      </p>
      <h3 className="mt-1 text-[20px] leading-none font-black">
        How to get a free key
      </h3>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-[14px] leading-[1.45] text-[#4a4a4a]">
        <li>
          Open{" "}
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noreferrer"
            className="font-bold underline"
          >
            Groq API Keys
          </a>{" "}
          and sign in or create a Groq account.
        </li>
        <li>
          Click Create API Key, copy the generated key, and paste it above.
        </li>
        <li>
          Keep the default Groq settings unless you need a different model or
          endpoint.
        </li>
      </ol>
      <p className="mt-3 text-[13px] leading-[1.45] text-[#757575]">
        Groq has a Free plan for building and testing. Usage is capped by rate
        limits, so check{" "}
        <a
          href="https://console.groq.com/docs/rate-limits"
          target="_blank"
          rel="noreferrer"
          className="font-bold underline"
        >
          Groq rate limits
        </a>{" "}
        if requests start failing with 429 errors.
      </p>
    </section>
  )
}

function AddKeyForm({
  onSaved,
  onCancel,
}: {
  onSaved: (key: StoredKey) => void
  onCancel: () => void
}) {
  const apiKeyId = useId()
  const providerId = useId()
  const endpointId = useId()
  const modelId = useId()
  const labelId = useId()

  const [provider, setProvider] = useState<AiProvider>("groq")
  const [endpoint, setEndpoint] = useState(PROVIDER_DEFAULTS.groq.endpoint)
  const [model, setModel] = useState(PROVIDER_DEFAULTS.groq.model)
  const [apiKey, setApiKey] = useState("")
  const [label, setLabel] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  function handleProviderChange(nextProvider: AiProvider) {
    const defaults = PROVIDER_DEFAULTS[nextProvider]
    setProvider(nextProvider)
    setEndpoint(defaults.endpoint)
    setModel(defaults.model)
    setLabel((current) => current || defaults.label)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!apiKey.trim() || !endpoint.trim() || !model.trim()) return

    setIsSaving(true)
    try {
      const key = await saveApiKey({
        provider,
        endpoint: endpoint.trim(),
        apiKey: apiKey.trim(),
        model: model.trim(),
        label: label.trim() || PROVIDER_DEFAULTS[provider].label,
      })
      onSaved(key)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 border-2 border-black bg-white p-5"
    >
      <div>
        <label
          htmlFor={apiKeyId}
          className="mb-1 block text-[13px] font-medium text-[#1a1a1a]"
        >
          API key
        </label>
        <div className="flex gap-2">
          <input
            id={apiKeyId}
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            required
            placeholder="Paste provider API key"
            className="flex-1 border-2 border-black bg-white px-3 py-2 text-[14px] text-[#1a1a1a] outline-none"
          />
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setShowKey((s) => !s)}
            aria-label={showKey ? "Hide API key" : "Show API key"}
          >
            {showKey ? <EyeOff /> : <Eye />}
          </Button>
        </div>
        <p className="mt-2 text-[12px] leading-[1.4] text-[#757575]">
          Uses Groq free-tier defaults. Open Advanced to change provider,
          endpoint, model, or label.
        </p>
      </div>

      <details className="border-2 border-black bg-white">
        <summary className="cursor-pointer px-3 py-2 font-mono text-[11px] font-bold tracking-[0.1em] text-[#1a1a1a] uppercase">
          Advanced options
        </summary>
        <div className="grid gap-3 border-t-2 border-black p-3">
          <div>
            <label
              htmlFor={providerId}
              className="mb-1 block text-[13px] font-medium text-[#1a1a1a]"
            >
              Provider
            </label>
            <select
              id={providerId}
              value={provider}
              onChange={(event) =>
                handleProviderChange(event.target.value as AiProvider)
              }
              className="w-full border-2 border-black bg-white px-3 py-2 text-[14px] text-[#1a1a1a] outline-none"
            >
              {AI_PROVIDERS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={endpointId}
              className="mb-1 block text-[13px] font-medium text-[#1a1a1a]"
            >
              Endpoint URL
            </label>
            <input
              id={endpointId}
              type="url"
              value={endpoint}
              onChange={(event) => setEndpoint(event.target.value)}
              required
              className="w-full border-2 border-black bg-white px-3 py-2 text-[14px] text-[#1a1a1a] outline-none"
            />
          </div>

          <div>
            <label
              htmlFor={modelId}
              className="mb-1 block text-[13px] font-medium text-[#1a1a1a]"
            >
              Model
            </label>
            <input
              id={modelId}
              type="text"
              value={model}
              onChange={(event) => setModel(event.target.value)}
              required
              className="w-full border-2 border-black bg-white px-3 py-2 text-[14px] text-[#1a1a1a] outline-none"
            />
          </div>

          <div>
            <label
              htmlFor={labelId}
              className="mb-1 block text-[13px] font-medium text-[#1a1a1a]"
            >
              Label (optional)
            </label>
            <input
              id={labelId}
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={PROVIDER_DEFAULTS[provider].label}
              className="w-full border-2 border-black bg-white px-3 py-2 text-[14px] text-[#1a1a1a] outline-none"
            />
          </div>
        </div>
      </details>

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? <LoaderCircle className="animate-spin" /> : <KeyRound />}
          {isSaving ? "Saving..." : "Save key"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function KeyRow({
  storedKey,
  onDelete,
}: {
  storedKey: StoredKey
  onDelete: () => void
}) {
  const [showKey, setShowKey] = useState(false)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-black bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-[14px] font-medium text-[#1a1a1a]">
          {storedKey.label}
        </p>
        <p className="truncate font-mono text-[12px] text-[#757575]">
          {PROVIDER_NAMES[storedKey.provider]} / {storedKey.model}
        </p>
        <p className="truncate font-mono text-[11px] text-[#757575]">
          {storedKey.endpoint}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setShowKey((s) => !s)}
          className="p-1.5 text-[#757575] transition-colors hover:text-[#1a1a1a]"
          aria-label={showKey ? "Hide key" : "Show key"}
        >
          {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 text-[#757575] transition-colors hover:text-[#A8321A]"
          aria-label="Delete key"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      {showKey && (
        <div className="mt-2 basis-full">
          <p className="font-mono text-[11px] break-all text-[#757575]">
            {storedKey.apiKey}
          </p>
        </div>
      )}
    </div>
  )
}
