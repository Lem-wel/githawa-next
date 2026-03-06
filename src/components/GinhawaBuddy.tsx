"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Msg = {
  role: "user" | "bot";
  text: string;
};

export default function GinhawaBuddy() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "bot",
      text: "Hi, I’m Ginhawa Buddy 🌿 How are you feeling today? I can help you choose a spa service.",
    },
  ]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();

    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: data.error || "Something went wrong.",
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: data.reply,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "I’m having trouble connecting right now.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") sendMessage();
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: 20,
          left: 20,
          width: 60,
          height: 60,
          borderRadius: "999px",
          border: "none",
          background: "#2e8b7d",
          color: "#fff",
          fontSize: 24,
          cursor: "pointer",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          zIndex: 9999,
        }}
      >
        💬
      </button>

      {/* Chat Window */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 90,
            left: 20,
            width: 340,
            maxHeight: 500,
            background: "#fff",
            borderRadius: 18,
            boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#2e8b7d",
              color: "#fff",
              padding: "14px 16px",
              fontWeight: 700,
            }}
          >
            Ginhawa Buddy
          </div>

          <div
            style={{
              padding: 12,
              flex: 1,
              overflowY: "auto",
              background: "#f7faf9",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "10px 12px",
                    borderRadius: 14,
                    background: msg.role === "user" ? "#2e8b7d" : "#e8f3f0",
                    color: msg.role === "user" ? "#fff" : "#1f2937",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.4,
                  }}
                >
                  {msg.text}

                  {msg.role === "bot" &&
                    msg.text.toLowerCase().includes("proceed to booking") && (
                      <div style={{ marginTop: 10 }}>
                        <button
                          onClick={() => router.push("/book")}
                          style={{
                            border: "none",
                            background: "#1f6f63",
                            color: "#fff",
                            padding: "8px 12px",
                            borderRadius: 10,
                            cursor: "pointer",
                            fontSize: 14,
                          }}
                        >
                          Proceed to Booking
                        </button>
                      </div>
                    )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ color: "#666", fontSize: 14 }}>Ginhawa Buddy is typing...</div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              padding: 10,
              borderTop: "1px solid #e5e7eb",
              background: "#fff",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about a spa service..."
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                outline: "none",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              style={{
                border: "none",
                background: "#2e8b7d",
                color: "#fff",
                padding: "10px 14px",
                borderRadius: 10,
                cursor: "pointer",
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}