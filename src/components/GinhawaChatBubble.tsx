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

type StaffRow = {
  id?: number;
  full_name?: string | null;
  name?: string | null;
  department?: string | null;
  position?: string | null;
  role?: string | null;
};

type ServiceRow = {
  id?: number;
  name?: string | null;
  title?: string | null;
  description?: string | null;
};

type StaffItem = {
  name: string;
  role: string;
};

type ServiceItem = {
  name: string;
};

type BotReply = string | { text: string; action?: ActionType };

const QUICK_REPLIES = [
  "Services",
  "Book appointment",
  "Staff",
  "Contact",
];

function prettyRole(role: string) {
  return role
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatStaff(staff: StaffItem[]) {
  if (staff.length === 0) {
    return "Our staff list is still being updated in the system.";
  }
  return staff.map((s) => `${s.name} (${s.role})`).join(", ");
}

function formatServices(services: ServiceItem[]) {
  if (services.length === 0) {
    return "Our service list is still being updated in the system.";
  }

  const names = services.map((s) => s.name);
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function getBotReply(
  input: string,
  staff: StaffItem[],
  services: ServiceItem[]
): BotReply {
  const msg = input.toLowerCase().trim();

  if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
    return "Hello. I’m Ginhawa Buddy. I can help you with services, booking, staff, contact details, and wellness information.";
  }

  if (
    msg.includes("staff") ||
    msg.includes("therapist") ||
    msg.includes("who works") ||
    msg.includes("employee")
  ) {
    return `Our current staff members are ${formatStaff(
      staff
    )} Staff availability depends on the selected appointment schedule.`;
  }

  if (
    msg.includes("service") ||
    msg.includes("massage") ||
    msg.includes("offer") ||
    msg.includes("treatment")
  ) {
    return `Our available services include ${formatServices(
      services
    )} Please visit the services or booking page for the latest details.`;
  }

  if (
    msg.includes("book") ||
    msg.includes("appointment") ||
    msg.includes("schedule") ||
    msg.includes("reserve")
  ) {
    return {
      text: "You can now proceed to the booking page to schedule your appointment.",
      action: "booking",
    };
  }

  if (
    msg.includes("location") ||
    msg.includes("where") ||
    msg.includes("address")
  ) {
    return "Our location details can be found on the Contact or About page of the website.";
  }

  if (
    msg.includes("contact") ||
    msg.includes("email") ||
    msg.includes("phone") ||
    msg.includes("facebook")
  ) {
    return "You may contact us through the website contact page or our official communication channels. If some details are not yet visible, they may still be under update.";
  }

  if (
    msg.includes("price") ||
    msg.includes("cost") ||
    msg.includes("how much") ||
    msg.includes("rate")
  ) {
    return "Service pricing should be shown on the website. If exact prices are not visible yet, that information may still be under update.";
  }

  if (
    msg.includes("reward") ||
    msg.includes("badge") ||
    msg.includes("points")
  ) {
    return "Ginhawa includes a rewards and badge feature for customer engagement. If some reward details are not yet visible, that part may still be under development.";
  }

  return "I’m sorry, that information may still be under update in the Ginhawa system.";
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

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, open]);

  useEffect(() => {
  async function loadData() {
    // STAFF
    const { data: staffData, error: staffError } = await supabase
      .from("staff")
      .select("*")
      .order("id", { ascending: true });

    console.log("STAFF DATA:", staffData);
    console.log("STAFF ERROR:", staffError);

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

    // SERVICES
    const { data: serviceData, error: serviceError } = await supabase
      .from("services")
      .select("*")
      .order("id", { ascending: true });

    console.log("SERVICES DATA:", serviceData);
    console.log("SERVICES ERROR:", serviceError);

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

    setTimeout(() => {
      const reply = getBotReply(cleanText, staff, services);

      const botMsg: Message =
        typeof reply === "string"
          ? {
              id: nextIdRef.current++,
              sender: "bot",
              text: reply,
            }
          : {
              id: nextIdRef.current++,
              sender: "bot",
              text: reply.text,
              action: reply.action,
            };

      setMessages((prev) => [...prev, botMsg]);
      setTyping(false);
    }, 600);
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
              background:
                "linear-gradient(180deg, #f7f3ee 0%, #f3efe8 100%)",
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
                    borderRadius: msg.sender === "user"
                      ? "20px 20px 8px 20px"
                      : "20px 20px 20px 8px",
                    background:
                      msg.sender === "user" ? "#879f87" : "#ebe4d8",
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
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#ebe4d8",
                  border: "1px solid rgba(118,132,112,0.12)",
                  borderRadius: "20px 20px 20px 8px",
                  padding: "12px 14px",
                  color: "#667360",
                }}
              >
                <span className="ginhawa-dot" />
                <span className="ginhawa-dot delay1" />
                <span className="ginhawa-dot delay2" />
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
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: #7f8d78;
          display: inline-block;
          animation: ginhawa-bounce 1s infinite ease-in-out;
        }

        .delay1 {
          animation-delay: 0.15s;
        }

        .delay2 {
          animation-delay: 0.3s;
        }

        @keyframes ginhawa-bounce {
          0%,
          80%,
          100% {
            transform: translateY(0);
            opacity: 0.45;
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