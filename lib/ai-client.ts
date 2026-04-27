import { openAiAdapter } from "@/lib/openai-adapter"
import { anthropicAdapter } from "@/lib/anthropic-adapter"
import type { AiAdapterConfig, AiMessage } from "@/lib/ai-types"

export async function sendAiRequest({
  messages,
  config,
}: {
  messages: AiMessage[]
  config: AiAdapterConfig
}): Promise<string> {
  const adapter = config.provider === "anthropic" ? anthropicAdapter : openAiAdapter
  return adapter.send(messages, config)
}
