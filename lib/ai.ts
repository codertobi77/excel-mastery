export type ChatMessage = { role: "system" | "user" | "assistant"; content: string }

export async function aiChat(params: {
  messages?: ChatMessage[]
  system?: string
  temperature?: number
  max_tokens?: number
  model?: string
}): Promise<string> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "AI request failed")
  }
  const data = await res.json()
  return data.content || ""
}

export async function aiChatStream(params: {
  messages?: ChatMessage[]
  system?: string
  temperature?: number
  max_tokens?: number
  model?: string
  onToken: (token: string) => void
  onDone?: () => void
  signal?: AbortSignal
}) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...params, stream: true }),
    signal: params.signal,
  })
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "")
    throw new Error(text || "AI stream failed")
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder("utf-8")
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      // OpenRouter SSE lines often contain: data: {json}\n
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data:")) continue
        const json = line.slice(5).trim()
        if (json === "[DONE]") continue
        try {
          const evt = JSON.parse(json)
          const token = evt?.choices?.[0]?.delta?.content || evt?.choices?.[0]?.message?.content || ""
          if (token) params.onToken(token)
        } catch {
          // Ignore non-JSON keepalive lines
        }
      }
    }
  } finally {
    params.onDone?.()
    reader.releaseLock()
  }
}


