import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENROUTER_API_KEY" },
        { status: 500 }
      );
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
        model: "google/gemma-3-4b-it:free",
        models: [
          "google/gemma-3-4b-it:free",
          "microsoft/phi-3-mini-128k-instruct:free",
          "meta-llama/llama-3.2-3b-instruct:free"
        ],
        provider: {
          allow_fallbacks: true
        },
        messages: [
          {
            role: "system",
            content: `You are Ginhawa Buddy, a friendly spa and wellness assistant for Ginhawa Spa & Wellness.

Help users choose spa services, suggest relaxation treatments, and encourage booking when appropriate.
Do not make medical diagnoses.
Keep answers short, calm, and helpful.
When recommending a service, end with: "Would you like to proceed to booking?"`
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter error:", data);
      return NextResponse.json(
        { error: data?.error?.message || "OpenRouter request failed." },
        { status: response.status }
      );
    }

    const reply =
      data?.choices?.[0]?.message?.content || "Sorry, I could not generate a response.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}