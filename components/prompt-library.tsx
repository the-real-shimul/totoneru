"use client"

import { BookOpen, LoaderCircle, Trash2 } from "lucide-react"
import { useId, useState } from "react"

import { Button } from "@/components/ui/button"
import type { ActiveDeck } from "@/lib/deck-model"
import { CURATED_PROMPTS, estimateCost, estimateTokens, interpolatePrompt, type UserPrompt } from "@/lib/prompts"
import { getFieldRoleLabel } from "@/lib/schema-mapping"
import type { FieldRole } from "@/lib/schema-mapping"

const STORAGE_KEY = "totoneru_user_prompts"

function loadUserPrompts(): UserPrompt[] {
  if (typeof window === "undefined") return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as UserPrompt[]
  } catch {
    return []
  }
}

function saveUserPrompts(prompts: UserPrompt[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts))
}

export function PromptLibrary({
  activeDeck,
  onSelectPrompt,
  selectedPromptId,
}: {
  activeDeck: ActiveDeck
  onSelectPrompt: (prompt: UserPrompt | null) => void
  selectedPromptId: string | null
}) {
  const [userPrompts, setUserPrompts] = useState<UserPrompt[]>(() => loadUserPrompts())

  const allPrompts = [...CURATED_PROMPTS, ...userPrompts]

  function handleDelete(promptId: string) {
    const updated = userPrompts.filter((p) => p.id !== promptId)
    setUserPrompts(updated)
    saveUserPrompts(updated)
    if (selectedPromptId === promptId) {
      onSelectPrompt(null)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[16px] font-medium text-foreground">Prompt library</p>
        <p className="text-[13px] text-muted-foreground">
          {allPrompts.length} prompts available · {CURATED_PROMPTS.length} curated
        </p>
      </div>

      <div className="space-y-2">
        {allPrompts.map((prompt) => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            activeDeck={activeDeck}
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
  activeDeck,
  isSelected,
  onSelect,
  onDelete,
}: {
  prompt: UserPrompt
  activeDeck: ActiveDeck
  isSelected: boolean
  onSelect: () => void
  onDelete?: () => void
}) {
  const isCurated = prompt.id.startsWith("curated-")

  const variableValues = getSampleVariableValues(prompt, activeDeck)
  const interpolated = interpolatePrompt(prompt.userMessage, variableValues)
  const tokenEstimate = estimateTokens(interpolated + prompt.systemMessage)
  const costEstimate = estimateCost(tokenEstimate, "gpt-4o-mini")

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
      className={`w-full rounded-[12px] border p-4 text-left transition-colors cursor-pointer ${
        isSelected
          ? "border-foreground/20 bg-muted"
          : "border-border bg-background/60 hover:bg-muted/50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-medium text-foreground">{prompt.name}</p>
            {isCurated && (
              <span className="shrink-0 rounded-full bg-[rgba(74,122,78,0.12)] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] text-[#2E5C33]">
                Curated
              </span>
            )}
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5">{prompt.description}</p>
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="shrink-0 rounded-[6px] p-1.5 text-muted-foreground hover:text-destructive transition-colors"
            aria-label={`Delete prompt "${prompt.name}"`}
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {prompt.variables.map((v) => (
          <span
            key={v.name}
            className="rounded-[6px] bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
          >
            {v.name} → {getFieldRoleLabel(v.role)}
          </span>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-3">
        <span className="font-mono text-[11px] text-muted-foreground">
          ~{tokenEstimate} tokens
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">
          ~${costEstimate.toFixed(4)}
        </span>
      </div>
    </div>
  )
}

function getSampleVariableValues(
  prompt: UserPrompt,
  activeDeck: ActiveDeck
): Record<string, string> {
  const values: Record<string, string> = {}
  const firstNote = activeDeck.deck.sampleNotes[0]
  if (!firstNote) return values

  const noteType = activeDeck.deck.noteTypes.find(
    (nt) => nt.id === firstNote.noteTypeId
  )
  if (!noteType) return values

  const mapping = activeDeck.noteTypeMappings.find(
    (m) => m.noteTypeId === noteType.id
  )
  if (!mapping) return values

  const roleToFieldName: Record<string, string> = {}
  for (const [fieldName, role] of Object.entries(mapping.fieldMappings)) {
    roleToFieldName[role] = fieldName
  }

  for (const variable of prompt.variables) {
    const fieldName = roleToFieldName[variable.role]
    if (fieldName) {
      const index = noteType.fieldNames.indexOf(fieldName)
      if (index >= 0) {
        values[variable.name] = firstNote.fieldValues[index] ?? ""
      }
    }
  }

  return values
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
      createdAt: new Date().toISOString(),
    }

    const existing = loadUserPrompts()
    saveUserPrompts([...existing, prompt])
    onSave(prompt)

    setIsSaving(false)
    setName("")
    setDescription("")
    setSystemMessage("")
    setUserMessage("")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor={nameId} className="block text-[13px] font-medium text-foreground mb-1">
          Name
        </label>
        <input
          id={nameId}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="My custom prompt"
          className="w-full rounded-[8px] border border-border bg-background px-3 py-2 text-[14px] text-foreground outline-none"
        />
      </div>

      <div>
        <label htmlFor={descriptionId} className="block text-[13px] font-medium text-foreground mb-1">
          Description
        </label>
        <input
          id={descriptionId}
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What this prompt does"
          className="w-full rounded-[8px] border border-border bg-background px-3 py-2 text-[14px] text-foreground outline-none"
        />
      </div>

      <div>
        <label htmlFor={systemId} className="block text-[13px] font-medium text-foreground mb-1">
          System message (optional)
        </label>
        <textarea
          id={systemId}
          value={systemMessage}
          onChange={(e) => setSystemMessage(e.target.value)}
          rows={3}
          placeholder="You are a helpful Japanese language assistant..."
          className="w-full rounded-[8px] border border-border bg-background px-3 py-2 text-[14px] text-foreground outline-none resize-none"
        />
      </div>

      <div>
        <label htmlFor={userId} className="block text-[13px] font-medium text-foreground mb-1">
          User message
        </label>
        <textarea
          id={userId}
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          rows={4}
          required
          placeholder="Generate an example sentence for: {{expression}}"
          className="w-full rounded-[8px] border border-border bg-background px-3 py-2 text-[14px] text-foreground outline-none resize-none"
        />
        <p className="mt-1 text-[12px] text-muted-foreground">
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
