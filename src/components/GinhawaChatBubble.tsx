"use client";

import { useEffect, useRef, useState } from "react";

type Sender = "user" | "bot";

type Message = {
  id: number;
  sender: Sender;
  text: string;
};

function getBotReply(input: string): string {
  const msg = input.toLowerCase().trim();

  // greetings
  if (
    msg.includes("hi") ||
    msg.includes("hello") ||
    msg.includes("hey") ||
    msg.includes("good morning") ||
    msg.includes("good afternoon")
  ) {
    return "Hello! I’m Ginhawa Buddy. I can help you with services, booking, schedules, rewards, wellness activities, and other website information.";
  }

  // services
  if (
    msg.includes("service") ||
    msg.includes("spa") ||
    msg.includes("massage") ||
    msg.includes("offer") ||
    msg.includes("treatment")
  ) {
    return "Ginhawa offers spa and wellness-related services such as relaxation treatments, massage sessions, and other wellness options shown on the website.";
  }

  // booking
  if (
    msg.includes("book") ||
    msg.includes("booking") ||
    msg.includes("appointment") ||
    msg.includes("reserve") ||
    msg.includes("schedule")
  ) {
    return "You can book an appointment by going to the booking page, selecting your preferred service, date, and time, then confirming your schedule.";
  }

  // staff
  if (
    msg.includes("staff") ||
    msg.includes("therapist") ||
    msg.includes("employee") ||
    msg.includes("specialist")
  ) {
    return "Staff availability depends on the selected service and appointment schedule shown in the system.";
  }

  // rewards / badges
  if (
    msg.includes("badge") ||
    msg.includes("reward") ||
    msg.includes("points") ||
    msg.includes("milestone")
  ) {
    return "Ginhawa includes a milestone-based rewards feature where customers may earn badges through completed bookings and wellness engagement.";
  }

  // referral
  if (
    msg.includes("referral") ||
    msg.includes("refer") ||
    msg.includes("invite") ||
    msg.includes("code")
  ) {
    return "Referral features may be available for selected users. If your code or reward is not visible yet, the setup may still be incomplete or pending update.";
  }

  // activities
  if (
    msg.includes("yoga") ||
    msg.includes("pilates") ||
    msg.includes("gym") ||
    msg.includes("activity") ||
    msg.includes("wellness")
  ) {
    return "Ginhawa may also recommend wellness activities such as yoga, pilates, gym sessions, or other self-care options depending on available content.";
  }

  // hours
  if (
    msg.includes("hours") ||
    msg.includes("open") ||
    msg.includes("closing") ||
    msg.includes("time")
  ) {
    return "Operating hours may vary depending on the services and schedules currently posted on the website.";
  }

  // location
  if (
    msg.includes("location") ||
    msg.includes("address") ||
    msg.includes("where") ||
    msg.includes("branch")
  ) {
    return "Location details should appear in the contact or about section. If exact details are still missing, the content may still be under update.";
  }

  // payment
  if (
    msg.includes("payment") ||
    msg.includes("pay") ||
    msg.includes("gcash") ||
    msg.includes("cash") ||
    msg.includes("card")
  ) {
    return "Payment options depend on the current website setup. If they are not fully shown yet, that information may still be under development.";
  }

  // contact
  if (
    msg.includes("contact") ||
    msg.includes("email") ||
    msg.includes("phone") ||
    msg.includes("facebook") ||
    msg.includes("message")
  ) {
    return "You may check the contact page for available communication details. Some contact information may still be pending update.";
  }

  // fallback
  return "I’m sorry, but I don’t have complete data for that yet. That information may still be under review, under update, or not yet available in the current Ginhawa system.";
}

const QUICK_REPLIES = [
  "Services",
  "Book appointment",
  "Rewards",
  "Referral code",
  "Location",
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
      text: "Hi! I’m Ginhawa Buddy. How can I help you today?",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const nextIdRef = useRef(2);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, open]);

  function pushUserAndBotReply(text: string) {
    const cleanText = text.trim();
    if (!cleanText) return;

    const userMessage: Message = {
      id: nextIdRef.current++,
      sender: "user",
      text: cleanText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const botMessage: Message = {
        id: nextIdRef.current++,
        sender: "bot",
        text: getBotReply(cleanText),
      };

      setMessages((prev) => [...prev, botMessage]);
      setTyping(false);
    }, 900);
  }

  function handleSend() {
    pushUserAndBotReply(input);
  }

  return (
    <>
      {open && (
        <div
          style={{
            position: "fixed",
            left: 20,
            bottom: 95,
            width: 340,
            height: 470,
            background: "#ffffff",
            borderRadius: 20,
            boxShadow: "0 12px 35px rgba(0,0,0,0.18)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            zIndex: 9999,
            border: "1px solid #ececec",
            fontFamily: "Arial, sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #7c6cff, #9c8cff)",
              color: "#fff",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Ginhawa Buddy</div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>
                Wellness website assistant
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "#fff",
                fontSize: 22,
                cursor: "pointer",
                lineHeight: 1,
              }}
              aria-label="Close chat"
              title="Close"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: 12,
              overflowY: "auto",
              background: "#f7f7ff",
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent:
                    msg.sender === "user" ? "flex-end" : "flex-start",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    maxWidth: "82%",
                    padding: "10px 13px",
                    borderRadius: 14,
                    background:
                      msg.sender === "user" ? "#7c6cff" : "#ecebff",
                    color: msg.sender === "user" ? "#fff" : "#222",
                    fontSize: 14,
                    lineHeight: 1.45,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {typing && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    background: "#ecebff",
                    borderRadius: 14,
                    padding: "10px 14px",
                    display: "inline-flex",
                    gap: 5,
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#8a84c9",
                      display: "inline-block",
                      animation: "ginhawa-bounce 1s infinite 0s",
                    }}
                  />
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#8a84c9",
                      display: "inline-block",
                      animation: "ginhawa-bounce 1s infinite 0.15s",
                    }}
                  />
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#8a84c9",
                      display: "inline-block",
                      animation: "ginhawa-bounce 1s infinite 0.3s",
                    }}
                  />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          <div
            style={{
              padding: "8px 10px 0 10px",
              background: "#fff",
              borderTop: "1px solid #efefef",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                paddingBottom: 8,
              }}
            >
              {QUICK_REPLIES.map((item) => (
                <button
                  key={item}
                  onClick={() => pushUserAndBotReply(item)}
                  style={{
                    whiteSpace: "nowrap",
                    border: "1px solid #d9d7ff",
                    background: "#f4f3ff",
                    color: "#5b50d6",
                    padding: "7px 12px",
                    borderRadius: 999,
                    fontSize: 12,
                    cursor: "pointer",
                    flex: "0 0 auto",
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: 10,
              background: "#fff",
            }}
          >
            <input
              type="text"
              placeholder="Ask something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              style={{
                flex: 1,
                border: "1px solid #d7d7d7",
                borderRadius: 12,
                padding: "11px 12px",
                outline: "none",
                fontSize: 14,
              }}
            />
            <button
              onClick={handleSend}
              style={{
                border: "none",
                borderRadius: 12,
                padding: "0 16px",
                background: "#7c6cff",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Floating button on left */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open chatbot"
        title="Chat with Ginhawa Buddy"
        style={{
          position: "fixed",
          left: 20,
          bottom: 20,
          width: 62,
          height: 62,
          borderRadius: "50%",
          border: "none",
          background: "linear-gradient(135deg, #7c6cff, #9c8cff)",
          color: "#fff",
          fontSize: 26,
          cursor: "pointer",
          boxShadow: "0 10px 25px rgba(124,108,255,0.35)",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        💬
      </button>

      <style jsx>{`
        @keyframes ginhawa-bounce {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          40% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}