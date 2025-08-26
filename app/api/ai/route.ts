import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { messages, system, temperature = 0.3, max_tokens = 1024, model, stream = false } = await request.json();

    // Basic validation and sane defaults
    const safeTemperature = Math.max(0, Math.min(1, Number(temperature) || 0.3));
    const safeMaxTokens = Math.max(128, Math.min(4096, Number(max_tokens) || 1024));
    const msgs = Array.isArray(messages) ? messages : [];
    if (!msgs.length && !system) {
      return NextResponse.json({ error: "messages or system prompt required" }, { status: 400 });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "Missing OPENROUTER_API_KEY" }, { status: 500 });
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    };

    if (process.env.NEXT_PUBLIC_SITE_URL) headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_SITE_URL;
    if (process.env.NEXT_PUBLIC_SITE_NAME) headers["X-Title"] = process.env.NEXT_PUBLIC_SITE_NAME;

    const allowedModels = [
      "deepseek/deepseek-r1",
      "openai/gpt-4o-mini",
      "google/gemini-1.5-flash-latest",
    ];
    const selectedModel = allowedModels.includes(model) ? model : "deepseek/deepseek-r1";

    const body = {
      model: selectedModel,
      messages: [
        ...(system ? [{ role: "system", content: system }] : []),
        ...msgs,
      ],
      temperature: safeTemperature,
      max_tokens: safeMaxTokens,
    };

    // Streaming support
    if (stream) {
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify({ ...body, stream: true }),
      })
      if (!resp.ok || !resp.body) {
        const text = await resp.text().catch(() => "")
        return NextResponse.json({ error: text || "Upstream error" }, { status: 502 })
      }
      const readable = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder()
          const reader = resp.body!.getReader()
          controller.enqueue(encoder.encode("event: open\n\n"))
          try {
            while (true) {
              const { value, done } = await reader.read()
              if (done) break
              if (value) controller.enqueue(value)
            }
            controller.enqueue(encoder.encode("event: done\n\n"))
          } catch (e) {
            controller.enqueue(encoder.encode(`event: error\ndata: ${String(e)}\n\n`))
          } finally {
            controller.close()
          }
        },
      })
      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      })
    }

    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: text || "Upstream error" }, { status: 502 });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ content });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}


