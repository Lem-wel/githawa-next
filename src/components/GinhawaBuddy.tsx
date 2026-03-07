"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Sender = "user" | "bot";
type ActionType = "booking";

type Message = {
  id: number;
  sender: Sender;
  text: string;
  action?: ActionType;
};

type StaffItem = {
  name: string;
  role: string;
};

type ServiceItem = {
  name: string;
};

type BotReply = {
  text: string;
  action?: ActionType;
};

const QUICK_REPLIES = [
  "What services do you offer?",
  "Book appointment",
  "Who are your staff?",
  "How can I contact you?",
];

function prettyRole(role: string) {
  return role
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeText(text: string) {
  return text.toLowerCase().trim();
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((word) => text.includes(word));
}

function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function formatStaff(staff: StaffItem[]) {
  if (staff.length === 0) {
    return "I can’t retrieve the staff list right now because the data may still be unavailable or restricted in the system.";
  }

  if (staff.length <= 3) {
    return staff.map((s) => `${s.name} (${s.role})`).join(", ");
  }

  const firstFew = staff.slice(0, 4).map((s) => `${s.name} (${s.role})`).join(", ");
  const remaining = staff.length - 4;

  return `${firstFew}${remaining > 0 ? `, and ${remaining} more team member${remaining > 1 ? "s" : ""}` : ""}`;
}

function formatAllStaff(staff: StaffItem[]) {
  if (staff.length === 0) {
    return "I can’t retrieve the staff list right now because the data may still be unavailable or restricted in the system.";
  }

  if (staff.length === 1) {
    return `${staff[0].name} (${staff[0].role})`;
  }

  if (staff.length === 2) {
    return `${staff[0].name} (${staff[0].role}) and ${staff[1].name} (${staff[1].role})`;
  }

  const mapped = staff.map((s) => `${s.name} (${s.role})`);
  return `${mapped.slice(0, -1).join(", ")}, and ${mapped[mapped.length - 1]}`;
}

function formatServices(services: ServiceItem[]) {
  if (services.length === 0) {
    return "I can’t retrieve the service list right now because it may still be under update in the system.";
  }

  const names = services.map((s) => s.name);

  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function findStaffByRole(staff: StaffItem[], roleKeywords: string[]) {
  return staff.filter((s) =>
    roleKeywords.some((keyword) => s.role.toLowerCase().includes(keyword))
  );
}
function randomAnswer(answers: string[]) {
  return answers[Math.floor(Math.random() * answers.length)];
}

function getBotReply(
  input: string,
  staff: StaffItem[],
  services: ServiceItem[]
): BotReply {

  const msg = input.toLowerCase();

  // GREETING
  if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
    return {
      text: randomAnswer([
        "Hello! I'm Ginhawa Buddy. How may I assist you today?",
        "Hi there. I'm here to help you explore Ginhawa services or bookings.",
        "Welcome! Feel free to ask about services, booking, or our staff.",
        "Hello and welcome to Ginhawa. What would you like to know today?",
        "Hi! I'm the Ginhawa website assistant. How can I help?"
      ])
    };
  }

  // STAFF
  if (msg.includes("staff") || msg.includes("employee") || msg.includes("therapist")) {

    if (staff.length === 0) {
      return {
        text: randomAnswer([
          "It seems the staff information is still being updated in the system.",
          "I can't retrieve the staff list right now. The system may still be loading the data.",
          "Our staff list is currently unavailable, but it should appear soon once the system finishes updating.",
          "The staff information may still be syncing in the database."
        ])
      };
    }

    return {
      text: randomAnswer([
        `Our team currently includes ${formatStaff(staff)}.`,
        `Here are the staff members currently listed: ${formatStaff(staff)}.`,
        `The Ginhawa team includes ${formatStaff(staff)}.`,
        `Our available staff members are ${formatStaff(staff)}.`,
        `These are the staff members currently registered in the system: ${formatStaff(staff)}.`,
      ])
    };
  }

  // SERVICES
  if (msg.includes("service") || msg.includes("massage") || msg.includes("treatment")) {

    if (services.length === 0) {
      return {
        text: randomAnswer([
          "Our services are still being updated in the system.",
          "I can't retrieve the services right now, but they should appear soon.",
          "The service list may still be syncing in the database.",
          "Our available treatments will appear once the system finishes loading."
        ])
      };
    }

    return {
      text: randomAnswer([
        `Currently, we offer services such as ${formatServices(services)}.`,
        `Our available spa services include ${formatServices(services)}.`,
        `You can explore services like ${formatServices(services)}.`,
        `Some of our treatments include ${formatServices(services)}.`,
        `Here are some services currently available: ${formatServices(services)}.`,
      ])
    };
  }

  // BOOKING
  if (
    msg.includes("book") ||
    msg.includes("appointment") ||
    msg.includes("schedule")
  ) {
    return {
      text: randomAnswer([
        "Sure. You can proceed to the booking page to schedule your appointment.",
        "I'd be happy to help with that. Please continue to the booking page.",
        "You can book an appointment through the booking section of the website.",
        "To schedule a visit, please proceed to the booking page below.",
        "Appointments can be arranged through the booking page."
      ]),
      action: "booking"
    };
  }

  // CONTACT
  if (msg.includes("contact") || msg.includes("phone") || msg.includes("email")) {
    return {
      text: randomAnswer([
        "You may check the Contact page on the website for our official communication channels.",
        "Our contact details are listed in the Contact section of the website.",
        "For inquiries, please visit the Contact page.",
        "You can find our official contact information in the Contact section.",
        "The best way to reach us is through the Contact page on the website."
      ])
    };
  }

  // LOCATION
  if (msg.includes("location") || msg.includes("where")) {
    return {
      text: randomAnswer([
        "Our location details are available on the Contact page.",
        "You can find our address in the Contact section of the website.",
        "Please check the Contact page to see our location details.",
        "The website should display our location information on the Contact page."
      ])
    };
  }

  // FALLBACK
  return {
    text: randomAnswer([
      "I'm not completely sure about that yet. Some parts of the system may still be updating.",
      "That information might still be unavailable in the current system.",
      "I may not have the exact details for that yet.",
      "The website may still be updating that information.",
      "I'm still learning about that part of the system."
    ])
  };
}

export default function GinhawaChatBubble() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [staff, setStaff] = useState<StaffItem[]>([]);
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
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, open]);

  useEffect(() => {
    async function loadData() {
      const { data: staffData } = await supabase
        .from("staff")
        .select("*")
        .order("id", { ascending: true });

      if (Array.isArray(staffData)) {
        const mappedStaff: StaffItem[] = staffData
          .map((row: any) => {
            const rawName =
              row.full_name ??
              row.name ??
              row.staff_name ??
              row.employee_name ??
              "";

            const rawRole =
              row.department ??
              row.position ??
              row.role ??
              row.job_title ??
              "Staff";

            return {
              name: String(rawName).trim(),
              role: prettyRole(String(rawRole).trim() || "Staff"),
            };
          })
          .filter((item) => item.name.length > 0);

        setStaff(mappedStaff);
      }

      const { data: serviceData } = await supabase
        .from("services")
        .select("*")
        .order("id", { ascending: true });

      if (Array.isArray(serviceData)) {
        const mappedServices: ServiceItem[] = serviceData
          .map((row: any) => {
            const rawName = row.name ?? row.title ?? row.service_name ?? "";
            return {
              name: String(rawName).trim(),
            };
          })
          .filter((item) => item.name.length > 0);

        setServices(mappedServices);
      }
    }

    loadData();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  function getRandomReplyDelay(text: string) {
    const base = 900;
    const variable = Math.floor(Math.random() * 1800);
    const extraByLength = Math.min(text.length * 18, 1600);
    return base + variable + extraByLength;
  }

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

    const delay = 1200 + Math.random() * 2000;

    typingTimeoutRef.current = setTimeout(() => {
      const reply = getBotReply(cleanText, staff, services);

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
            position: "fixed",
            left: 24,
            bottom: 96,
            width: 360,
            height: 500,
            background: "#f7f3ee",
            borderRadius: 28,
            boxShadow: "0 18px 45px rgba(60, 70, 50, 0.14)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 999,
            border: "1px solid rgba(90, 104, 84, 0.14)",
            backdropFilter: "blur(10px)",
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
                  letterSpacing: 0.2,
                }}
              >
                Calm support for your wellness visit
              </div>
            </div>

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
                  justifyContent:
                    msg.sender === "user" ? "flex-end" : "flex-start",
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
                    boxShadow:
                      msg.sender === "user"
                        ? "0 8px 18px rgba(135,159,135,0.14)"
                        : "0 8px 18px rgba(80,90,70,0.05)",
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
                          border: "1px solid rgba(111,143,114,0.95)",
                          boxShadow: "0 8px 20px rgba(111,143,114,0.18)",
                        }}
                      >
                        Proceed to Booking
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#ebe4d8",
                    border: "1px solid rgba(118,132,112,0.12)",
                    borderRadius: "20px 20px 20px 8px",
                    padding: "12px 14px",
                    color: "#667360",
                    boxShadow: "0 8px 18px rgba(80,90,70,0.05)",
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
              placeholder="Ask about services, booking, or staff..."
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
                boxShadow: "0 8px 18px rgba(111,143,114,0.18)",
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open chat"
        style={{
          position: "fixed",
          left: 24,
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