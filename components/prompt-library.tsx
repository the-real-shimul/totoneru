"use client"

import { BookOpen, LoaderCircle, Trash2 } from "lucide-react"
import { useId, useState } from "react"

import { Button } from "@/components/ui/button"
import type { ActiveDeck } from "@/lib/deck-model"
import {
  createBrowserStore,
  useBrowserStore,
} from "@/lib/browser-store"
import { CURATED_PROMPTS, type UserPrompt } from "@/lib/prompts"
import { getFieldRoleLabel } from "@/lib/schema-mapping"
import type { FieldRole } from "@/lib/schema-mapping"

const STORAGE_KEY = "totoneru_user_prompts"

function parsePrompts(raw: string | null): UserPrompt[] {
  if (!raw) return []
  try {
    return JSON.parse(raw) as UserPrompt[]
  } catch {
    return []
  }
}

const userPromptsStore = createBrowserStore<UserPrompt[]>({
  key: STORAGE_KEY,
  parse: parsePrompts,
  serialize: JSON.stringify,
  defaultValue: [],
})

export function PromptLibrary({
  activeDeck,
  onSelectPrompt,
  selectedPromptId,
}: {
  activeDeck: ActiveDeck
  onSelectPrompt: (prompt: UserPrompt | null) => void
  selectedPromptId: string | null
}) {
  const userPrompts = useBrowserStore(userPromptsStore)
  const allPrompts = [...CURATED_PROMPTS, ...userPrompts]

  function handleDelete(promptId: string) {
    const updated = userPrompts.filter((p) => p.id !== promptId)
    userPromptsStore.set(updated)
    if (selectedPromptId === promptId) {
      onSelectPrompt(null)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[16px] font-medium text-[#1a1a1a]">Prompt library</p>
        <p className="text-[13px] text-[#757575]">
          {allPrompts.length} prompts · {CURATED_PROMPTS.length} curated
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {allPrompts.map((prompt, index) => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            index={index}
            isSelected={selectedPromptId === prompt.id}
            onSelect={() => onSelectPrompt(prompt)}
            onDelete={
              !prompt.id.startsWith("curated-")
                ? () => handleDelete(prompt.id)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  )
}

function PromptCard({
  prompt,
  index,
  isSelected,
  onSelect,
  onDelete,
}: {
  prompt: UserPrompt
  index: number
  isSelected: boolean
  onSelect: () => void
  onDelete?: () => void
}) {
  const isCurated = prompt.id.startsWith("curated-")

  function handleCardKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onSelect()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={onSelect}
      onKeyDown={handleCardKeyDown}
      className={`group relative min-h-32 border-2 border-black bg-white p-4 text-left transition-transform hover:-translate-y-1 hover:bg-black hover:text-white cursor-pointer ${
        isSelected ? "bg-[#f5f5f5]" : ""
      } ${index % 2 === 0 ? "rotate-[-1deg]" : "rotate-[1deg]"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[15px] font-bold leading-tight">{prompt.name}</p>
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="shrink-0 p-1 text-[#757575] hover:text-[#A8321A] transition-colors group-hover:text-white/70 group-hover:hover:text-[#ff6b6b]"
            aria-label={`Delete prompt "${prompt.name}"`}
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>

      {isCurated && (
        <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#2E5C33] group-hover:text-[#4A7A4E]">
          Curated
        </p>
      )}

      {/* Details shown on hover */}
      <div className="mt-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <p className="text-[12px] leading-[1.45] text-[#757575] group-hover:text-white/80">
          {prompt.description}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {prompt.variables.map((v) => (
            <span
              key={v.name}
              className="border border-white/20 px-1.5 py-0.5 font-mono text-[10px] text-white/70"
            >
              {v.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function PromptEditor({
  onSave,
}: {
  onSave: (prompt: UserPrompt) => void
}) {
  const nameId = useId()
  const descriptionId = useId()
  const systemId = useId()
  const userId = useId()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [systemMessage, setSystemMessage] = useState("")
  const [userMessage, setUserMessage] = useState("")
  const [outputRole, setOutputRole] = useState<FieldRole>("meaning")
  const [isSaving, setIsSaving] = useState(false)

  const variables = extractVariables(userMessage + systemMessage)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim() || !userMessage.trim()) return

    setIsSaving(true)

    const prompt: UserPrompt = {
      id: `user-${crypto.randomUUID()}`,
      name: name.trim(),
      description: description.trim(),
      systemMessage: systemMessage.trim(),
      userMessage: userMessage.trim(),
      variables: variables.map((name) => ({
        name,
        role: "expression" as FieldRole,
        description: name,
      })),
      outputRole,
      createdAt: new Date().toISOString(),
    }

    const existing = userPromptsStore.get()
    userPromptsStore.set([...existing, prompt])
    onSave(prompt)

    setIsSaving(false)
    setName("")
    setDescription("")
    setSystemMessage("")
    setUserMessage("")
    setOutputRole("meaning")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor={nameId} className="block text-[13px] font-medium text-[#1a1a1a] mb-1">
          Name
        </label>
        <input
          id={nameId}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="My custom prompt"
          className="w-full border-2 border-black bg-white px-3 py-2 text-[14px] text-[#1a1a1a] outline-none"
        />
      </div>

      <div>
        <label htmlFor={descriptionId} className="block text-[13px] font-medium text-[#1a1a1a] mb-1">
          Description
        </label>
        <input
          id={descriptionId}
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What this prompt does"
          className="w-full border-2 border-black bg-white px-3 py-2 text-[14px] text-[#1a1a1a] outline-none"
        />
      </div>

      <div>
        <label htmlFor={systemId} className="block text-[13px] font-medium text-[#1a1a1a] mb-1">
          System message (optional)
        </label>
        <textarea
          id={systemId}
          value={systemMessage}
          onChange={(e) => setSystemMessage(e.target.value)}
          rows={3}
          placeholder="You are a helpful Japanese language assistant..."
          className="w-full border-2 border-black bg-white px-3 py-2 text-[14px] text-[#1a1a1a] outline-none resize-none"
        />
      </div>

      <div>
        <label className="block text-[13px] font-medium text-[#1a1a1a] mb-1">
          Output field
        </label>
        <select
          value={outputRole}
          onChange={(e) => setOutputRole(e.target.value as FieldRole)}
          className="w-full border-2 border-black bg-white px-3 py-2 text-[14px] text-[#1a1a1a] outline-none"
        >
          {["expression", "reading", "meaning", "sentence", "sentenceReading", "translation", "audio", "unknown"].map((role) => (
            <option key={role} value={role}>
              {getFieldRoleLabel(role as FieldRole)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={userId} className="block text-[13px] font-medium text-[#1a1a1a] mb-1">
          User message
        </label>
        <textarea
          id={userId}
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          rows={4}
          required
          placeholder="Generate an example sentence for: {{expression}}"
          className="w-full border-2 border-black bg-white px-3 py-2 text-[14px] text-[#1a1a1a] outline-none resize-none"
        />
        <p className="mt-1 text-[12px] text-[#757575]">
          Use {"{{variableName}}"} for placeholders. Detected: {variables.length > 0 ? variables.join(", ") : "none"}
        </p>
      </div>

      <Button type="submit" disabled={isSaving}>
        {isSaving ? <LoaderCircle className="animate-spin" /> : <BookOpen />}
        {isSaving ? "Saving..." : "Save prompt"}
      </Button>
    </form>
  )
}

function extractVariables(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g)
  if (!matches) return []
  return [...new Set(matches.map((m) => m.slice(2, -2)))]
}
