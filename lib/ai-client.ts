import { anthropicAdapter } from "@/lib/anthropic-adapter"
import { openAiAdapter } from "@/lib/openai-adapter"
import type { AiAdapterConfig, AiMessage, AiProvider } from "@/lib/ai-types"

export async function sendAiRequest({
  provider,
  messages,
  config,
}: {
  provider: AiProvider
  messages: AiMessage[]
  config: AiAdapterConfig
}): Promise<string> {
  const adapter = provider === "anthropic" ? anthropicAdapter : openAiAdapter
  return adapter.send(messages, config)
}
