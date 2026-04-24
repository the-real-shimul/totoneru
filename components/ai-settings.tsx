"use client"

import { Eye, EyeOff, KeyRound, LoaderCircle, Plus, Trash2 } from "lucide-react"
import { useEffect, useId, useState } from "react"

import { Button } from "@/components/ui/button"
import { AI_PROVIDERS } from "@/lib/ai-types"
import type { AiProvider } from "@/lib/ai-types"
import {
  deleteApiKey,
  loadApiKeys,
  saveApiKey,
  type StoredKey,
} from "@/lib/ai-keys"

const DEFAULT_ENDPOINTS: Record<AiProvider, string> = {
  openai: "https://api.openai.com/v1/chat/completions",
  anthropic: "https://api.anthropic.com/v1/messages",
}

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
          <p className="text-[16px] font-medium text-foreground">AI API keys</p>
          <p className="text-[13px] text-muted-foreground">
            Keys are stored locally in your browser. Never sent to our servers.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowForm((s) => !s)}
        >
          {showForm ? "Cancel" : <Plus />}
          {showForm ? "Cancel" : "Add key"}
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
        <p className="text-[14px] text-muted-foreground">
          No API keys saved. Add one to enable AI transformations.
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
  const providerId = useId()
  const endpointId = useId()
  const apiKeyId = useId()
  const modelId = useId()
  const labelId = useId()

  const [provider, setProvider] = useState<AiProvider>("openai")
  const [endpoint, setEndpoint] = useState(DEFAULT_ENDPOINTS.openai)
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("gpt-4o-mini")
  const [label, setLabel] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  function handleProviderChange(newProvider: AiProvider) {
    setProvider(newProvider)
    setEndpoint(DEFAULT_ENDPOINTS[newProvider])
    setModel(newProvider === "anthropic" ? "claude-3-sonnet-20240229" : "gpt-4o-mini")
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
        label: label.trim() || `${AI_PROVIDERS.find((p) => p.id === provider)?.name} — ${model}`,
      })
      onSaved(key)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[12px] border border-border bg-background/60 p-5 space-y-3"
    >
      <div>
        <label htmlFor={providerId} className="block text-[13px] font-medium text-foreground mb-1">
          Provider
        </label>
        <select
          id={providerId}
          value={provider}
          onChange={(e) => handleProviderChange(e.target.value as AiProvider)}
          className="w-full rounded-[8px] border border-border bg-background px-3 py-2 text-[14px] text-foreground outline-none"
        >
          {AI_PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={endpointId} className="block text-[13px] font-medium text-foreground mb-1">
          Endpoint URL
        </label>
        <input
          id={endpointId}
          type="url"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          required
          className="w-full rounded-[8px] border border-border bg-background px-3 py-2 text-[14px] text-foreground outline-none"
        />
      </div>

      <div>
        <label htmlFor={apiKeyId} className="block text-[13px] font-medium text-foreground mb-1">
          API key
        </label>
        <div className="flex gap-2">
          <input
            id={apiKeyId}
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            required
            placeholder="sk-..."
            className="flex-1 rounded-[8px] border border-border bg-background px-3 py-2 text-[14px] text-foreground outline-none"
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
        <label htmlFor={modelId} className="block text-[13px] font-medium text-foreground mb-1">
          Model
        </label>
        <input
          id={modelId}
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          required
          className="w-full rounded-[8px] border border-border bg-background px-3 py-2 text-[14px] text-foreground outline-none"
        />
      </div>

      <div>
        <label htmlFor={labelId} className="block text-[13px] font-medium text-foreground mb-1">
          Label (optional)
        </label>
        <input
          id={labelId}
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={`${AI_PROVIDERS.find((p) => p.id === provider)?.name} — ${model}`}
          className="w-full rounded-[8px] border border-border bg-background px-3 py-2 text-[14px] text-foreground outline-none"
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
    <div className="flex items-center justify-between gap-3 rounded-[8px] border border-border bg-background/60 px-4 py-3">
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-foreground truncate">
          {storedKey.label}
        </p>
        <p className="font-mono text-[12px] text-muted-foreground truncate">
          {storedKey.endpoint}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setShowKey((s) => !s)}
          className="rounded-[6px] p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={showKey ? "Hide key" : "Show key"}
        >
          {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-[6px] p-1.5 text-muted-foreground hover:text-destructive transition-colors"
          aria-label="Delete key"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      {showKey && (
        <div className="basis-full mt-2">
          <p className="font-mono text-[11px] text-muted-foreground break-all">
            {storedKey.apiKey}
          </p>
        </div>
      )}
    </div>
  )
}
