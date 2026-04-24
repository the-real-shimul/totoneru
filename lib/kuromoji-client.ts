type KuromojiToken = {
  surface_form: string
  reading?: string
  pronunciation?: string
  pos: string
}

type WorkerRequest =
  | { type: "tokenize"; id: number; text: string }
  | { type: "furigana"; id: number; text: string }

type WorkerResponse =
  | { type: "tokenize"; id: number; tokens: KuromojiToken[] }
  | { type: "furigana"; id: number; html: string }
  | { type: "error"; id: number; message: string }
  | { type: "ready" }

let worker: Worker | null = null
let requestId = 0
const pending = new Map<number, { resolve: (value: unknown) => void; reject: (reason: Error) => void }>()

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("../workers/kuromoji.worker.ts", import.meta.url), {
      type: "classic",
    })

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data

      if (response.type === "ready") {
        return
      }

      const handler = pending.get(response.id)
      if (!handler) return

      pending.delete(response.id)

      if (response.type === "error") {
        handler.reject(new Error(response.message))
        return
      }

      if (response.type === "tokenize") {
        handler.resolve(response.tokens)
        return
      }

      if (response.type === "furigana") {
        handler.resolve(response.html)
        return
      }
    }

    worker.onerror = (event) => {
      console.error("Kuromoji worker error:", event)
    }
  }

  return worker
}

function sendRequest<T>(request: Omit<WorkerRequest, "id">): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = ++requestId
    pending.set(id, { resolve: resolve as (value: unknown) => void, reject })
    getWorker().postMessage({ ...request, id })
  })
}

export async function tokenize(text: string): Promise<KuromojiToken[]> {
  return sendRequest<KuromojiToken[]>({ type: "tokenize", text })
}

export async function generateFurigana(text: string): Promise<string> {
  return sendRequest<string>({ type: "furigana", text })
}
