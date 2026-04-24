import type { AiAdapter } from "@/lib/ai-types"

export const openAiAdapter: AiAdapter = {
  name: "OpenAI-compatible",

  async send(messages, config) {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.3,
        max_tokens: 2048,
      }),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => "")
      throw new Error(
        `AI request failed: ${response.status} ${response.statusText}${body ? ` — ${body}` : ""}`
      )
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
      error?: { message?: string }
    }

    if (data.error?.message) {
      throw new Error(`AI error: ${data.error.message}`)
    }

    const content = data.choices?.[0]?.message?.content
    if (!content) {
      throw new Error("AI response had no content")
    }

    return content.trim()
  },
}
