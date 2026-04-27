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

const PROVIDER_DEFAULTS: Record<AiProvider, { endpoint: string; model: string; label: string }> = {
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
          <p className="text-[16px] font-medium text-[#1a1a1a]">AI provider keys</p>
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
    </div>
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
      className="border-2 border-black bg-white p-5 space-y-3"
    >
      <div>
        <label htmlFor={providerId} className="block text-[13px] font-medium text-[#1a1a1a] mb-1">
          Provider
        </label>
        <select
          id={providerId}
          value={provider}
          onChange={(event) => handleProviderChange(event.target.value as AiProvider)}
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
        <label htmlFor={endpointId} className="block text-[13px] font-medium text-[#1a1a1a] mb-1">
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
        <label htmlFor={modelId} className="block text-[13px] font-medium text-[#1a1a1a] mb-1">
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
        <label htmlFor={apiKeyId} className="block text-[13px] font-medium text-[#1a1a1a] mb-1">
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
      </div>

      <div>
        <label htmlFor={labelId} className="block text-[13px] font-medium text-[#1a1a1a] mb-1">
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
        <p className="text-[14px] font-medium text-[#1a1a1a] truncate">
          {storedKey.label}
        </p>
        <p className="font-mono text-[12px] text-[#757575] truncate">
          {PROVIDER_NAMES[storedKey.provider]} / {storedKey.model}
        </p>
        <p className="font-mono text-[11px] text-[#757575] truncate">
          {storedKey.endpoint}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setShowKey((s) => !s)}
          className="p-1.5 text-[#757575] hover:text-[#1a1a1a] transition-colors"
          aria-label={showKey ? "Hide key" : "Show key"}
        >
          {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 text-[#757575] hover:text-[#A8321A] transition-colors"
          aria-label="Delete key"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      {showKey && (
        <div className="basis-full mt-2">
          <p className="font-mono text-[11px] text-[#757575] break-all">
            {storedKey.apiKey}
          </p>
        </div>
      )}
    </div>
  )
}
