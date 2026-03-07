"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  forceOpen?: boolean;
};

type Sender = "user" | "bot";
type ActionType = "booking" | "contact";

type Message = {
  id: number;
  sender: Sender;
  text: string;
  action?: ActionType;
};

type ServiceItem = {
  name: string;
  description?: string | null;
  price?: number | null;
  category?: string | null;
};

type BotReply = {
  text: string;
  action?: ActionType;
};

const QUICK_REPLIES = [
  "Book an appointment",
  "What services do you offer?",
  "How much are your services?",
  "I want a massage",
];

function includesAny(text: string, keywords: string[]) {
  return keywords.some((word) => text.includes(word));
}

function formatServices(services: ServiceItem[]) {
  if (services.length === 0) {
    return "massage services, facial treatments, and other wellness services";
  }

  const names = services.map((s) => s.name);

  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function getMassageServices(services: ServiceItem[]) {
  return services.filter((s) =>
    `${s.name} ${s.description ?? ""} ${s.category ?? ""}`
      .toLowerCase()
      .includes("massage")
  );
}

function getFacialServices(services: ServiceItem[]) {
  return services.filter((s) =>
    `${s.name} ${s.description ?? ""} ${s.category ?? ""}`
      .toLowerCase()
      .match(/facial|skin|face/)
  );
}

function getBotReply(input: string, services: ServiceItem[]): BotReply {
  const msg = input.toLowerCase().trim();

  if (includesAny(msg, ["hello", "hi", "hey", "good morning", "good afternoon"])) {
    return {
      text: "Hello. Welcome to Ginhawa Spa & Wellness. I can help you with booking, services, prices, and recommendations.",
    };
  }

  if (includesAny(msg, ["book", "booking", "appointment", "reserve", "schedule"])) {
    return {
      text: "I can help with your appointment. Please tap the booking button below to continue.",
      action: "booking",
    };
  }

  if (includesAny(msg, ["price", "prices", "cost", "rates", "how much"])) {
    return {
      text:
        services.length > 0
          ? `We currently offer ${formatServices(services)}. To see the available options and continue with scheduling, tap the booking button below.`
          : "You can view our services and pricing on the booking page. Tap the booking button below to continue.",
      action: "booking",
    };
  }

  if (includesAny(msg, ["massage", "relax", "relaxation", "stress", "stressed", "body pain", "tired"])) {
    const massageServices = getMassageServices(services);

    return {
      text:
        massageServices.length > 0
          ? `For relaxation, you may like ${formatServices(massageServices)}. You can continue to booking below.`
          : "For relaxation and stress relief, our massage services may be a good option. You can continue to booking below.",
      action: "booking",
    };
  }

  if (includesAny(msg, ["facial", "skin care", "skincare", "face treatment", "skin", "face"])) {
    const facialServices = getFacialServices(services);

    return {
      text:
        facialServices.length > 0
          ? `For skincare concerns, you may explore ${formatServices(facialServices)}. You can continue to booking below.`
          : "For skincare concerns, you may explore our facial services. You can continue to booking below.",
      action: "booking",
    };
  }

  if (includesAny(msg, ["service", "services", "offer", "offers", "treatment", "treatments"])) {
    return {
      text: `We currently offer ${formatServices(services)}. If you'd like, you can proceed to booking below.`,
      action: "booking",
    };
  }

  if (includesAny(msg, ["contact", "phone", "email", "facebook", "instagram"])) {
    return {
      text: "You may contact Ginhawa through the contact details shown on the website. If you're ready to set an appointment, you can also use the booking button below.",
      action: "contact",
    };
  }

  if (includesAny(msg, ["location", "address", "where", "place"])) {
    return {
      text: "Our location details are shown on the website. If you're ready for a visit, you can continue to booking below.",
      action: "booking",
    };
  }

  return {
    text: "I can help you with booking, services, prices, massage recommendations, and facial recommendations. Try asking something like 'I want a massage' or 'Book an appointment.'",
  };
}

export default function GinhawaCustomerChat({ forceOpen = false }: Props) {
  const [open, setOpen] = useState(forceOpen);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [services, setServices] = useState<ServiceItem[]>([]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "bot",
      text: "Welcome to Ginhawa. How may I help you today?",
    },
  ]);

  const nextIdRef = useRef(2);
  const endRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setOpen(forceOpen);
  }, [forceOpen]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, open]);

  useEffect(() => {
    async function loadData() {
      const { data: serviceData } = await supabase
        .from("services")
        .select("*")
        .order("id", { ascending: true });

      if (Array.isArray(serviceData)) {
        const mappedServices: ServiceItem[] = serviceData
          .map((row: any) => ({
            name: String(row.name ?? row.title ?? row.service_name ?? "").trim(),
            description: row.description ?? null,
            price: row.price ?? null,
            category: row.category ?? null,
          }))
          .filter((item) => item.name.length > 0);

        setServices(mappedServices);
      }
    }

    loadData();

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  function sendMessage(text: string) {
    const cleanText = text.trim();
    if (!cleanText) return;

    const userMsg: Message = {
      id: nextIdRef.current++,
      sender: "user",
      text: cleanText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    const delay = 700 + Math.random() * 900;

    typingTimeoutRef.current = setTimeout(() => {
      const reply = getBotReply(cleanText, services);

      const botMsg: Message = {
        id: nextIdRef.current++,
        sender: "bot",
        text: reply.text,
        action: reply.action,
      };

      setMessages((prev) => [...prev, botMsg]);
      setTyping(false);
    }, delay);
  }

  return (
    <>
      {open && (
        <div
          style={{
            position: forceOpen ? "relative" : "fixed",
            right: forceOpen ? undefined : 24,
            bottom: forceOpen ? undefined : 96,
            width: forceOpen ? "100%" : 360,
            maxWidth: forceOpen ? "100%" : 360,
            height: forceOpen ? "700px" : 500,
            background: "#f7f3ee",
            borderRadius: forceOpen ? 0 : 28,
            boxShadow: forceOpen ? "none" : "0 18px 45px rgba(60, 70, 50, 0.14)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 999,
            border: forceOpen ? "none" : "1px solid rgba(90, 104, 84, 0.14)",
          }}
        >
          <div
            style={{
              background: "linear-gradient(180deg, #9ab59d 0%, #88a98e 100%)",
              color: "#fdfbf7",
              padding: "18px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: 22,
                  fontWeight: 600,
                  lineHeight: 1.1,
                }}
              >
                Ginhawa Buddy
              </div>
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  opacity: 0.92,
                  marginTop: 4,
                }}
              >
                Booking and wellness assistant
              </div>
            </div>

            {!forceOpen && (
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                style={{
                  background: "rgba(255,255,255,0.18)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  color: "#fff",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  fontSize: 18,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            )}
          </div>

          <div
            style={{
              flex: 1,
              padding: 16,
              overflowY: "auto",
              background: "linear-gradient(180deg, #f7f3ee 0%, #f3efe8 100%)",
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    maxWidth: "82%",
                    padding: "12px 14px",
                    borderRadius:
                      msg.sender === "user"
                        ? "20px 20px 8px 20px"
                        : "20px 20px 20px 8px",
                    background: msg.sender === "user" ? "#879f87" : "#ebe4d8",
                    color: msg.sender === "user" ? "#fffdf9" : "#3f4d40",
                    border:
                      msg.sender === "user"
                        ? "1px solid rgba(135,159,135,0.8)"
                        : "1px solid rgba(118,132,112,0.12)",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.text}

                  {msg.action === "booking" && (
                    <div style={{ marginTop: 12 }}>
                      <Link
                        href="/book"
                        style={{
                          display: "inline-block",
                          padding: "10px 14px",
                          background: "#6f8f72",
                          color: "#fffdf9",
                          borderRadius: 999,
                          textDecoration: "none",
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        Book Appointment
                      </Link>
                    </div>
                  )}

                  {msg.action === "contact" && (
                    <div style={{ marginTop: 12 }}>
                      <Link
                        href="/contact"
                        style={{
                          display: "inline-block",
                          padding: "10px 14px",
                          background: "#6f8f72",
                          color: "#fffdf9",
                          borderRadius: 999,
                          textDecoration: "none",
                          fontSize: 13,
                          fontWeight: 600,
                          marginRight: 8,
                        }}
                      >
                        Contact Us
                      </Link>

                      <Link
                        href="/book"
                        style={{
                          display: "inline-block",
                          padding: "10px 14px",
                          background: "#ebe4d8",
                          color: "#3f4d40",
                          borderRadius: 999,
                          textDecoration: "none",
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        Book Instead
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#ebe4d8",
                    border: "1px solid rgba(118,132,112,0.12)",
                    borderRadius: "20px 20px 20px 8px",
                    padding: "12px 14px",
                  }}
                >
                  <span className="ginhawa-dot" />
                  <span className="ginhawa-dot delay1" />
                  <span className="ginhawa-dot delay2" />
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          <div
            style={{
              padding: "10px 12px 0",
              background: "#f7f3ee",
              borderTop: "1px solid rgba(90,104,84,0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                paddingBottom: 10,
              }}
            >
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  style={{
                    whiteSpace: "nowrap",
                    padding: "8px 14px",
                    borderRadius: 999,
                    border: "1px solid rgba(111,143,114,0.18)",
                    background: "#f0eadf",
                    color: "#53624f",
                    fontSize: 13,
                    fontFamily: "Inter, sans-serif",
                    cursor: "pointer",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              padding: 12,
              background: "#f7f3ee",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about booking, services, or prices..."
              style={{
                flex: 1,
                padding: "12px 14px",
                borderRadius: 999,
                border: "1px solid rgba(90,104,84,0.16)",
                background: "#fcfaf6",
                color: "#445344",
                fontSize: 14,
                fontFamily: "Inter, sans-serif",
                outline: "none",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage(input);
              }}
            />

            <button
              onClick={() => sendMessage(input)}
              style={{
                border: "none",
                borderRadius: 999,
                padding: "0 18px",
                background: "#6f8f72",
                color: "#fffdf9",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {!forceOpen && (
        <button
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Open chat"
          style={{
            position: "fixed",
            right: 24,
            bottom: 24,
            width: 68,
            height: 68,
            borderRadius: "50%",
            border: "1px solid rgba(111,143,114,0.16)",
            background: "linear-gradient(180deg, #98b39a 0%, #7d9d81 100%)",
            color: "#fffdf9",
            fontSize: 28,
            cursor: "pointer",
            boxShadow: "0 14px 30px rgba(111,143,114,0.22)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          💬
        </button>
      )}

      <style jsx>{`
        .ginhawa-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #7f8d78;
          display: inline-block;
          animation: ginhawa-bounce 1.05s infinite ease-in-out;
        }

        .delay1 {
          animation-delay: 0.18s;
        }

        .delay2 {
          animation-delay: 0.36s;
        }

        @keyframes ginhawa-bounce {
          0%,
          80%,
          100% {
            transform: translateY(0) scale(0.95);
            opacity: 0.45;
          }
          40% {
            transform: translateY(-5px) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}