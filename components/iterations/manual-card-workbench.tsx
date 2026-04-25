"use client"

import { Bot, LoaderCircle, Plus, Save, Trash2 } from "lucide-react"
import { useEffect, useId, useState } from "react"

import { Button } from "@/components/ui/button"
import { getActiveApiKey } from "@/lib/ai-keys"
import { sendAiRequest } from "@/lib/ai-client"
import {
  addManualWord,
  deleteManualWord,
  listManualWords,
  saveManualWord,
  setManualWordTarget,
  type ManualWord,
  type ManualWordTarget,
} from "@/lib/manual-words"

const fieldLabels = [
  ["reading", "Reading"],
  ["meaning", "Meaning"],
  ["sentence", "Example sentence"],
  ["translation", "Translation"],
  ["notes", "Notes"],
] as const

export function ManualCardWorkbench() {
  const expressionId = useId()
  const [expression, setExpression] = useState("")
  const [words, setWords] = useState<ManualWord[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const selected = words.find((word) => word.id === selectedId) ?? words[0] ?? null

  useEffect(() => {
    listManualWords().then((loaded) => {
      setWords(loaded)
      setSelectedId(loaded[0]?.id ?? null)
    })
  }, [])

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault()
    if (!expression.trim()) return
    setIsAdding(true)
    try {
      const word = await addManualWord(expression)
      setWords((current) => [word, ...current])
      setSelectedId(word.id)
      setExpression("")
    } finally {
      setIsAdding(false)
    }
  }

  async function handleDelete(id: string) {
    await deleteManualWord(id)
    setWords((current) => current.filter((word) => word.id !== id))
    if (selectedId === id) {
      setSelectedId(null)
    }
  }

  async function handleUpdate(word: ManualWord) {
    await saveManualWord(word)
    setWords((current) => current.map((item) => (item.id === word.id ? word : item)))
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <div className="border-2 border-black bg-white p-5 text-black">
        <form onSubmit={handleAdd} className="space-y-3">
          <label
            htmlFor={expressionId}
            className="font-mono text-[11px] font-bold uppercase tracking-[0.12em]"
          >
            New expression
          </label>
          <div className="flex gap-2">
            <input
              id={expressionId}
              value={expression}
              onChange={(event) => setExpression(event.target.value)}
              placeholder="整える"
              className="min-h-11 flex-1 border-2 border-black bg-white px-3 text-[15px] outline-none"
            />
            <Button
              type="submit"
              disabled={isAdding || !expression.trim()}
              className="rounded-none border-2 border-black bg-black text-white hover:bg-white hover:text-black"
            >
              {isAdding ? <LoaderCircle className="animate-spin" /> : <Plus />}
              Add
            </Button>
          </div>
        </form>

        <div className="mt-5 divide-y divide-black border-y-2 border-black">
          {words.length === 0 ? (
            <p className="py-4 text-[14px] text-[#757575]">
              No manual cards yet. Add one expression to start the mini-deck.
            </p>
          ) : (
            words.map((word) => (
              <button
                key={word.id}
                type="button"
                onClick={() => setSelectedId(word.id)}
                className={`flex w-full items-center justify-between gap-3 px-1 py-3 text-left ${
                  selected?.id === word.id ? "text-[#057dbc]" : "text-black"
                }`}
              >
                <span className="truncate text-[18px] font-black">{word.expression}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#757575]">
                  {word.targets.join("+")}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {selected ? (
        <ManualCardEditor
          key={selected.id}
          word={selected}
          onUpdate={handleUpdate}
          onDelete={() => handleDelete(selected.id)}
        />
      ) : (
        <div className="border-2 border-black p-8">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-[#757575]">
            Select a card
          </p>
          <p className="mt-2 text-[24px] font-black">The editor waits for an expression.</p>
        </div>
      )}
    </div>
  )
}

function ManualCardEditor({
  word,
  onUpdate,
  onDelete,
}: {
  word: ManualWord
  onUpdate: (word: ManualWord) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const [draft, setDraft] = useState(word)
  const [isSaving, setIsSaving] = useState(false)
  const [isFilling, setIsFilling] = useState(false)
  const [message, setMessage] = useState("")

  async function handleSave() {
    setIsSaving(true)
    try {
      await onUpdate(draft)
      setMessage("Saved locally.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleAiFill() {
    setIsFilling(true)
    setMessage("")
    try {
      const key = await getActiveApiKey()
      if (!key) {
        setMessage("Add an AI key first.")
        return
      }

      const raw = await sendAiRequest({
        config: {
          endpoint: key.endpoint,
          apiKey: key.apiKey,
          model: key.model,
        },
        messages: [
          {
            role: "system",
            content:
              "Return compact JSON only. Keys: reading, meaning, sentence, translation, notes. The user is making Japanese Anki cards.",
          },
          {
            role: "user",
            content: `Fill a Japanese Anki vocabulary card for: ${draft.expression}`,
          },
        ],
      })

      const parsed = parseAiJson(raw)
      const updated = {
        ...draft,
        generatedFields: {
          ...draft.generatedFields,
          ...parsed,
        },
      }
      setDraft(updated)
      await onUpdate(updated)
      setMessage("AI fill saved locally.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI fill failed.")
    } finally {
      setIsFilling(false)
    }
  }

  function updateField(field: keyof ManualWord["generatedFields"], value: string) {
    setDraft((current) => ({
      ...current,
      generatedFields: {
        ...current.generatedFields,
        [field]: value,
      },
    }))
  }

  function updateTarget(target: ManualWordTarget, enabled: boolean) {
    setDraft((current) => setManualWordTarget(current, target, enabled))
  }

  return (
    <div className="border-2 border-black bg-white p-5 text-black">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-black pb-4">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#757575]">
            Manual card
          </p>
          <h3 className="text-[32px] font-black leading-none tracking-[-0.02em]">
            {draft.expression}
          </h3>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onDelete}
          className="rounded-none border-2 border-black bg-white text-black hover:bg-black hover:text-white"
        >
          <Trash2 />
          Delete
        </Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {fieldLabels.map(([field, label]) => (
          <label key={field} className={field === "notes" ? "sm:col-span-2" : undefined}>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
              {label}
            </span>
            <textarea
              value={draft.generatedFields[field] ?? ""}
              onChange={(event) => updateField(field, event.target.value)}
              rows={field === "notes" ? 3 : 2}
              className="mt-1 w-full resize-none border-2 border-black bg-white px-3 py-2 text-[14px] outline-none"
            />
          </label>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 border-y-2 border-black py-3">
        <TargetCheckbox
          label="Standalone export"
          checked={draft.targets.includes("standalone")}
          onChange={(checked) => updateTarget("standalone", checked)}
        />
        <TargetCheckbox
          label="Merge into uploaded deck"
          checked={draft.targets.includes("deck")}
          onChange={(checked) => updateTarget("deck", checked)}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-none border-2 border-black bg-black text-white hover:bg-white hover:text-black"
        >
          {isSaving ? <LoaderCircle className="animate-spin" /> : <Save />}
          Save
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleAiFill}
          disabled={isFilling}
          className="rounded-none border-2 border-black bg-white text-black hover:bg-black hover:text-white"
        >
          {isFilling ? <LoaderCircle className="animate-spin" /> : <Bot />}
          AI fill
        </Button>
        {message && (
          <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[#757575]">
            {message}
          </span>
        )}
      </div>
    </div>
  )
}

function TargetCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-black"
      />
      {label}
    </label>
  )
}

function parseAiJson(raw: string): Partial<ManualWord["generatedFields"]> {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "")
  const parsed = JSON.parse(trimmed) as Record<string, unknown>
  return {
    reading: typeof parsed.reading === "string" ? parsed.reading : undefined,
    meaning: typeof parsed.meaning === "string" ? parsed.meaning : undefined,
    sentence: typeof parsed.sentence === "string" ? parsed.sentence : undefined,
    translation: typeof parsed.translation === "string" ? parsed.translation : undefined,
    notes: typeof parsed.notes === "string" ? parsed.notes : undefined,
  }
}
