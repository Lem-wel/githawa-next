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
    return "Hello! I'm Ginhawa Buddy. Ask me about services, booking, staff, contact details, or wellness information.";
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
      text: "Hi! I'm Ginhawa Buddy. How can I help you today?",
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
      const { data: staffData } = await supabase
        .from("staff")
        .select("id, full_name, name, position, role")
        .order("id", { ascending: true });

      if (Array.isArray(staffData)) {
        const mappedStaff: StaffItem[] = staffData
          .map((row: StaffRow) => {
            const rawName = row.full_name ?? row.name ?? "";
            const rawRole = row.position ?? row.role ?? "Staff";

            return {
              name: String(rawName).trim(),
              role: prettyRole(String(rawRole).trim() || "Staff"),
            };
          })
          .filter((item) => item.name.length > 0);

        setStaff(mappedStaff);
      }

      // SERVICES
      const { data: serviceData } = await supabase
        .from("services")
        .select("id, name, title, description")
        .order("id", { ascending: true });

      if (Array.isArray(serviceData)) {
        const mappedServices: ServiceItem[] = serviceData
          .map((row: ServiceRow) => {
            const rawName = row.name ?? row.title ?? "";
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
                    background: msg.sender === "user" ? "#7c6cff" : "#ecebff",
                    color: msg.sender === "user" ? "#fff" : "#000",
                    maxWidth: "80%",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.text}

                  {msg.action === "booking" && (
                    <div style={{ marginTop: 10 }}>
                      <Link
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
                      </Link>
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

            <div ref={endRef} />
          </div>

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