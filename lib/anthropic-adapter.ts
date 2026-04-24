import type { AiAdapter } from "@/lib/ai-types"

export const anthropicAdapter: AiAdapter = {
  name: "Anthropic",

  async send(messages, config) {
    const systemMessage = messages.find((m) => m.role === "system")
    const userMessages = messages.filter((m) => m.role !== "system")

    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 2048,
        temperature: 0.3,
        system: systemMessage?.content,
        messages: userMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => "")
      throw new Error(
        `AI request failed: ${response.status} ${response.statusText}${body ? ` — ${body}` : ""}`
      )
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>
      error?: { message?: string }
    }

    if (data.error?.message) {
      throw new Error(`AI error: ${data.error.message}`)
    }

    const text = data.content?.[0]?.text
    if (!text) {
      throw new Error("AI response had no content")
    }

    return text.trim()
  },
}
