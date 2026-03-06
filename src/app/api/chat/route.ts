import { NextResponse } from "next/server";

export async function POST(req: Request) {
    console.log("API KEY:", process.env.OPENROUTER_API_KEY);
  try {
    const { message } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENROUTER_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Ginhawa Buddy",
      },
      body: JSON.stringify({
        model: "google/gemma-3-4b-it:free",
        messages: [
          {
            role: "system",
            content: `
You are Ginhawa Buddy, a friendly spa and wellness assistant for Ginhawa Spa & Wellness.

Your job:
- Help users choose spa services
- Recommend suitable wellness treatments
- Suggest relaxation options
- Answer in a calm, friendly, short, helpful way
- Encourage booking when appropriate

Rules:
- Do not make medical diagnoses
- Do not give dangerous medical advice
- If a user mentions pain, severe symptoms, or emergency concerns, advise them to seek a licensed professional
- Keep responses simple and welcoming
- When recommending a service, end with:
"Would you like to proceed to booking?"
            `.trim(),
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
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