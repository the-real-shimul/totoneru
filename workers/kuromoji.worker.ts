declare function importScripts(...urls: string[]): void

importScripts("https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/build/kuromoji.js")

// Note: we use the global `kuromoji` loaded via importScripts.
// The type below is a minimal facade for what we need.

type KuromojiToken = {
  surface_form: string
  reading?: string
  pronunciation?: string
  pos: string
}

type KuromojiTokenizer = {
  tokenize(text: string): KuromojiToken[]
}

declare const kuromoji: {
  builder(options: { dicPath: string }): {
    build(callback: (err: Error | null, tokenizer: KuromojiTokenizer) => void): void
  }
}

type WorkerRequest =
  | { type: "tokenize"; id: number; text: string }
  | { type: "furigana"; id: number; text: string }

type WorkerResponse =
  | { type: "tokenize"; id: number; tokens: KuromojiToken[] }
  | { type: "furigana"; id: number; html: string }
  | { type: "error"; id: number; message: string }
  | { type: "ready" }

let tokenizerPromise: Promise<KuromojiTokenizer> | null = null

function getTokenizer(): Promise<KuromojiTokenizer> {
  if (!tokenizerPromise) {
    tokenizerPromise = new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath: "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict" }).build(
        (err, tokenizer) => {
          if (err) {
            reject(err)
            return
          }
          resolve(tokenizer)
        }
      )
    })
  }
  return tokenizerPromise
}

function hasKanji(text: string): boolean {
  return /[\u4e00-\u9faf]/.test(text)
}

function toHiragana(katakana: string): string {
  return katakana.replace(/[\u30a1-\u30f6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  )
}

function generateFuriganaHtml(text: string, tokens: KuromojiToken[]): string {
  let html = ""
  let position = 0

  for (const token of tokens) {
    const start = text.indexOf(token.surface_form, position)
    if (start === -1) {
      continue
    }

    if (start > position) {
      html += escapeHtml(text.slice(position, start))
    }

    const reading = token.reading || token.pronunciation
    if (reading && hasKanji(token.surface_form)) {
      const hiragana = toHiragana(reading)
      html += `<ruby>${escapeHtml(token.surface_form)}<rt>${escapeHtml(hiragana)}</rt></ruby>`
    } else {
      html += escapeHtml(token.surface_form)
    }

    position = start + token.surface_form.length
  }

  if (position < text.length) {
    html += escapeHtml(text.slice(position))
  }

  return html
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

async function handleMessage(request: WorkerRequest): Promise<WorkerResponse> {
  if (request.type === "tokenize") {
    const tokenizer = await getTokenizer()
    const tokens = tokenizer.tokenize(request.text)
    return { type: "tokenize", id: request.id, tokens }
  }

  if (request.type === "furigana") {
    const tokenizer = await getTokenizer()
    const tokens = tokenizer.tokenize(request.text)
    const html = generateFuriganaHtml(request.text, tokens)
    return { type: "furigana", id: request.id, html }
  }

  return { type: "error", id: (request as { id: number }).id, message: "Unknown request type" }
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  handleMessage(event.data)
    .then((response) => {
      self.postMessage(response)
    })
    .catch((error) => {
      self.postMessage({
        type: "error",
        id: event.data.id,
        message: error instanceof Error ? error.message : String(error),
      })
    })
}

// Signal readiness immediately — actual dictionary load happens lazily on first request
self.postMessage({ type: "ready" })
