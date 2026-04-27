export type AiMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

export type AiAdapterConfig = {
  endpoint: string
  apiKey: string
  model: string
  provider: AiProvider
}

export type AiAdapter = {
  name: string
  send(messages: AiMessage[], config: AiAdapterConfig): Promise<string>
}

export type AiProvider = "openai" | "anthropic" | "groq"

export const AI_PROVIDERS: { id: AiProvider; name: string }[] = [
  { id: "openai", name: "OpenAI-compatible" },
  { id: "anthropic", name: "Anthropic" },
  { id: "groq", name: "Groq" },
]
