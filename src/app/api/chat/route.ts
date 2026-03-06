import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENROUTER_API_KEY" }, { status: 500 });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ginhawa-next.vercel.app",
        "X-Title": "Ginhawa Buddy",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b:free",
        messages: [
          {
            role: "system",
            content:
              "You are Ginhawa Buddy, a friendly spa and wellness assistant. Keep answers short, calm, and helpful.",
          },
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    const text = await response.text();
    console.log("OpenRouter status:", response.status);
    console.log("OpenRouter raw:", text);

    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "OpenRouter request failed", raw: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      reply: data?.choices?.[0]?.message?.content || "No reply returned.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}