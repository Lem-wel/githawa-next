import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body?.message?.trim();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENROUTER_API_KEY" }, { status: 500 });
    }

    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ginhawa-next.vercel.app",
        "X-Title": "Ginhawa Buddy"
      },
      body: JSON.stringify({
        model: "google/gemma-3n-e4b-it:free",
        messages: [
          {
            role: "system",
            content: "You are Ginhawa Buddy, a friendly spa and wellness assistant. Keep answers short, calm, and helpful."
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const text = await orRes.text();
    console.log("OpenRouter status:", orRes.status);
    console.log("OpenRouter raw response:", text);

    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!orRes.ok) {
      return NextResponse.json(
        {
          error: data?.error?.message || data?.message || "OpenRouter request failed",
          raw: data
        },
        { status: orRes.status }
      );
    }

    return NextResponse.json({
      reply: data?.choices?.[0]?.message?.content || "No reply returned."
    });
  } catch (err) {
    console.error("API route error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}