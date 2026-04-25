import { openAiAdapter } from "@/lib/openai-adapter"
import type { AiAdapterConfig, AiMessage } from "@/lib/ai-types"

export async function sendAiRequest({
  messages,
  config,
}: {
  messages: AiMessage[]
  config: AiAdapterConfig
}): Promise<string> {
  return openAiAdapter.send(messages, config)
}
