"use client";

import { useState, useRef, useEffect } from "react";

type Sender = "user" | "bot";

type Message = {
  id: number;
  sender: Sender;
  text: string;
  action?: "booking";
};

const staff = [
  { name: "Airam Ricci", role: "Manager" },
  { name: "Franz Julian", role: "Receptionist" },
  { name: "David Russel", role: "Massage Therapist" },
  { name: "Yassy Kane", role: "Massage Therapist" },
  { name: "Linus Dominic", role: "Spa Attendant" },
  { name: "Sofia Bianca", role: "Spa Attendant" },
  { name: "Mary Avegail", role: "Spa Attendant" },
];

function formatStaff() {
  return staff.map((s) => `${s.name} (${s.role})`).join(", ");
}

function getBotReply(
  input: string
): string | { text: string; action?: "booking" } {
  const msg = input.toLowerCase();

  if (
    msg.includes("hello") ||
    msg.includes("hi") ||
    msg.includes("hey")
  ) {
    return "Hello! I'm Ginhawa Buddy. Ask me about services, booking, staff, or wellness activities.";
  }

  if (
    msg.includes("staff") ||
    msg.includes("therapist") ||
    msg.includes("who works")
  ) {
    return `Our current staff members are ${formatStaff()}. Staff availability depends on the selected appointment schedule.`;
  }

  if (
    msg.includes("book") ||
    msg.includes("appointment") ||
    msg.includes("schedule")
  ) {
    return {
      text: "You can now proceed to the booking page to schedule your appointment.",
      action: "booking",
    };
  }

  if (msg.includes("service") || msg.includes("massage")) {
    return "Ginhawa offers wellness and spa services including massage therapy and relaxation treatments.";
  }

  if (msg.includes("location") || msg.includes("where")) {
    return "Our location details can be found on the Contact page of the website.";
  }

  if (msg.includes("contact")) {
    return "You may contact us through our website contact page or official social media pages.";
  }

  return "I’m sorry, that information may still be under update in the Ginhawa system.";
}

const QUICK_REPLIES = [
  "Services",
  "Book appointment",
  "Staff",
  "Contact",
];

export default function GinhawaChatBubble() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "bot",
      text: "Hi! I'm Ginhawa Buddy. How can I help you today?",
    },
  ]);

  const nextIdRef = useRef(2);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function sendMessage(text: string) {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: nextIdRef.current++,
      sender: "user",
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const reply = getBotReply(text);

      let botMsg: Message;

      if (typeof reply === "string") {
        botMsg = {
          id: nextIdRef.current++,
          sender: "bot",
          text: reply,
        };
      } else {
        botMsg = {
          id: nextIdRef.current++,
          sender: "bot",
          text: reply.text,
          action: reply.action,
        };
      }

      setMessages((prev) => [...prev, botMsg]);
      setTyping(false);
    }, 700);
  }

  return (
    <>
      {open && (
        <div
          style={{
            position: "fixed",
            left: 20,
            bottom: 90,
            width: 330,
            height: 460,
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 999,
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "#7c6cff",
              color: "#fff",
              padding: 12,
              fontWeight: "bold",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            Ginhawa Buddy
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "#fff",
                fontSize: 18,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: 10,
              overflowY: "auto",
              background: "#f7f7ff",
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  textAlign: msg.sender === "user" ? "right" : "left",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    padding: "8px 12px",
                    borderRadius: 10,
                    background:
                      msg.sender === "user" ? "#7c6cff" : "#ecebff",
                    color: msg.sender === "user" ? "#fff" : "#000",
                    maxWidth: "80%",
                  }}
                >
                  {msg.text}

                  {msg.action === "booking" && (
                    <div style={{ marginTop: 10 }}>
                      <a
                        href="/booking"
                        style={{
                          display: "inline-block",
                          padding: "6px 12px",
                          background: "#7c6cff",
                          color: "#fff",
                          borderRadius: 6,
                          textDecoration: "none",
                          fontSize: 13,
                          fontWeight: "bold",
                        }}
                      >
                        Proceed to Booking
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <div style={{ fontSize: 12, color: "#666" }}>
                Ginhawa Buddy is typing...
              </div>
            )}

            <div ref={endRef}></div>
          </div>

          {/* Quick replies */}
          <div
            style={{
              display: "flex",
              gap: 6,
              padding: 8,
              flexWrap: "wrap",
            }}
          >
            {QUICK_REPLIES.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                style={{
                  fontSize: 12,
                  padding: "6px 10px",
                  borderRadius: 20,
                  border: "1px solid #ddd",
                  cursor: "pointer",
                }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div
            style={{
              display: "flex",
              padding: 8,
              gap: 6,
              borderTop: "1px solid #eee",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something..."
              style={{
                flex: 1,
                padding: 8,
                borderRadius: 8,
                border: "1px solid #ccc",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage(input);
              }}
            />

            <button
              onClick={() => sendMessage(input)}
              style={{
                background: "#7c6cff",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "0 12px",
                cursor: "pointer",
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          left: 20,
          bottom: 20,
          width: 60,
          height: 60,
          borderRadius: "50%",
          border: "none",
          background: "#7c6cff",
          color: "#fff",
          fontSize: 24,
          cursor: "pointer",
          boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
          zIndex: 1000,
        }}
      >
        💬
      </button>
    </>
  );
}