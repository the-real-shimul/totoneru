import type { FieldRole } from "@/lib/schema-mapping"

export type PromptVariable = {
  name: string
  role: FieldRole
  description: string
}

export type UserPrompt = {
  id: string
  name: string
  description: string
  systemMessage: string
  userMessage: string
  variables: PromptVariable[]
  createdAt: string
}

export const CURATED_PROMPTS: UserPrompt[] = [
  {
    id: "curated-example-sentence",
    name: "Generate example sentence",
    description: "Given a Japanese word, generate a natural example sentence with translation.",
    systemMessage:
      "You are a Japanese language assistant. Respond with a single example sentence in Japanese, followed by its English translation on a new line. Do not include any other text.",
    userMessage: "Generate a natural example sentence using the word: {{expression}}",
    variables: [
      {
        name: "expression",
        role: "expression",
        description: "The Japanese word or expression",
      },
    ],
    createdAt: "2026-04-25",
  },
  {
    id: "curated-meaning-clarify",
    name: "Clarify meaning",
    description: "Given a Japanese word and its reading, provide a clearer English definition.",
    systemMessage:
      "You are a Japanese dictionary writer. Provide a concise, clear English definition. One sentence only. No markdown.",
    userMessage: "Word: {{expression}}\nReading: {{reading}}\nCurrent meaning: {{meaning}}\n\nProvide a clearer, more precise definition.",
    variables: [
      {
        name: "expression",
        role: "expression",
        description: "The Japanese word",
      },
      {
        name: "reading",
        role: "reading",
        description: "The reading in kana",
      },
      {
        name: "meaning",
        role: "meaning",
        description: "The current English meaning",
      },
    ],
    createdAt: "2026-04-25",
  },
  {
    id: "curated-sentence-translation",
    name: "Refine sentence translation",
    description: "Given a Japanese sentence and a rough translation, produce a better one.",
    systemMessage:
      "You are a Japanese-English translator. Provide a natural, accurate English translation. One sentence only. No extra commentary.",
    userMessage: "Japanese: {{sentence}}\nCurrent translation: {{translation}}\n\nProvide a better translation.",
    variables: [
      {
        name: "sentence",
        role: "sentence",
        description: "The Japanese sentence",
      },
      {
        name: "translation",
        role: "translation",
        description: "The current English translation",
      },
    ],
    createdAt: "2026-04-25",
  },
  {
    id: "curated-expression-note",
    name: "Add usage note",
    description: "Add a short usage note for a Japanese word (formality, context, nuance).",
    systemMessage:
      "You are a Japanese language teacher. Write a 1-2 sentence usage note about register, context, or nuance. No markdown.",
    userMessage: "Word: {{expression}}\nReading: {{reading}}\nMeaning: {{meaning}}\n\nAdd a short usage note.",
    variables: [
      {
        name: "expression",
        role: "expression",
        description: "The Japanese word",
      },
      {
        name: "reading",
        role: "reading",
        description: "The reading in kana",
      },
      {
        name: "meaning",
        role: "meaning",
        description: "The English meaning",
      },
    ],
    createdAt: "2026-04-25",
  },
]

export function interpolatePrompt(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, name) => values[name] ?? `{{${name}}}`)
}

export function extractVariables(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g)
  if (!matches) return []
  return [...new Set(matches.map((m) => m.slice(2, -2)))]
}

export function sanitizeAiOutput(value: string): string {
  return value
    .replace(/^```[\w]*\n?/, "")
    .replace(/\n?```$/, "")
    .replace(/^["']|["']$/g, "")
    .trim()
}

export function estimateTokens(text: string): number {
  const cjkChars = text.match(/[\u4e00-\u9fff\u3040-\u30ff]/g)?.length ?? 0
  const otherChars = text.length - cjkChars
  return Math.ceil(cjkChars + otherChars / 4)
}

export function estimateCost(tokens: number, model: string): number {
  const modelLower = model.toLowerCase()
  let per1k = 0.0015
  if (modelLower.includes("gpt-4")) per1k = 0.03
  if (modelLower.includes("claude-3-opus")) per1k = 0.015
  if (modelLower.includes("claude-3-sonnet")) per1k = 0.003
  if (modelLower.includes("claude-3-haiku")) per1k = 0.00025
  if (modelLower.includes("gpt-3.5")) per1k = 0.0005
  return (tokens / 1000) * per1k
}
