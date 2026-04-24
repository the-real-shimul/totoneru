export type AiMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

export type AiAdapterConfig = {
  endpoint: string
  apiKey: string
  model: string
}

export type AiAdapter = {
  name: string
  send(messages: AiMessage[], config: AiAdapterConfig): Promise<string>
}

export type AiProvider = "openai" | "anthropic"

export const AI_PROVIDERS: { id: AiProvider; name: string }[] = [
  { id: "openai", name: "OpenAI-compatible" },
  { id: "anthropic", name: "Anthropic (native)" },
]
