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

function getBotReply(
  input: string,
  staff: StaffItem[],
  services: ServiceItem[]
): BotReply {
  const msg = normalizeText(input);

  if (includesAny(msg, ["hello", "hi", "hey", "good morning", "good afternoon"])) {
    return {
      text: pickRandom([
        "Hello. I’m Ginhawa Buddy. I can help you with services, booking, staff, schedules, and other website information.",
        "Hi there. I’m Ginhawa Buddy, your website assistant. You can ask me about services, bookings, staff, and contact details.",
        "Welcome to Ginhawa. I’m here to help with booking, services, staff information, and general website questions.",
      ]),
    };
  }

  if (includesAny(msg, ["thank you", "thanks", "ty"])) {
    return {
      text: pickRandom([
        "You’re welcome. Let me know if you’d like help with booking, staff, or services.",
        "Glad to help. You can also ask me about appointments, services, or contact details.",
        "You’re welcome. I’m here if you need anything else about Ginhawa.",
      ]),
    };
  }

  if (includesAny(msg, ["bye", "goodbye", "see you"])) {
    return {
      text: pickRandom([
        "Take care, and thank you for visiting Ginhawa.",
        "Goodbye. Wishing you a relaxing day ahead.",
        "See you again soon at Ginhawa.",
      ]),
    };
  }

  if (
    includesAny(msg, [
      "book",
      "appointment",
      "schedule",
      "reserve",
      "booking",
      "set appointment",
      "make appointment",
    ])
  ) {
    return {
      text: pickRandom([
        "Of course. You can proceed to the booking page to choose your preferred service, date, and schedule.",
        "I can help with that. Please continue to the booking page to select your service and preferred appointment time.",
        "Sure. You may now proceed to the booking page to arrange your appointment.",
      ]),
      action: "booking",
    };
  }

  if (
    includesAny(msg, [
      "service",
      "services",
      "massage",
      "offer",
      "offers",
      "treatment",
      "treatments",
      "spa service",
    ])
  ) {
    return {
      text:
        services.length > 0
          ? pickRandom([
              `Our available services currently include ${formatServices(services)}. You may check the services or booking page for the latest details.`,
              `Here are some of the services available at Ginhawa: ${formatServices(services)}. The full list is best viewed on the services page.`,
              `At the moment, our listed services include ${formatServices(services)}. You can explore them further on the website.`,
            ])
          : pickRandom([
              "Our service information appears to still be under update right now, so I can’t show the full list yet.",
              "I’m not seeing the full service list at the moment. That part of the website may still be updating.",
            ]),
    };
  }

  if (
    includesAny(msg, [
      "staff",
      "staffs",
      "employee",
      "employees",
      "who works",
      "team",
      "staff member",
      "staff members",
    ])
  ) {
    return {
      text:
        staff.length > 0
          ? pickRandom([
              `Our current team includes ${formatAllStaff(staff)}. Staff availability still depends on the appointment schedule selected.`,
              `Here are the staff members currently in the system: ${formatAllStaff(staff)}. Availability may vary by schedule.`,
              `Our listed staff members are ${formatAllStaff(staff)}. The assigned staff may depend on the selected service and time.`,
            ])
          : "I can’t retrieve the staff list right now because the data may still be unavailable or restricted in the system.",
    };
  }

  if (
    includesAny(msg, [
      "therapist",
      "therapists",
      "massage therapist",
      "massage therapists",
    ])
  ) {
    const therapists = findStaffByRole(staff, ["massage therapist", "therapist", "massage"]);
    return {
      text:
        therapists.length > 0
          ? `Our massage therapy team currently includes ${formatAllStaff(therapists)}. Their availability depends on the selected booking schedule.`
          : "I’m not seeing therapist details right now. That information may still be under update in the system.",
    };
  }

  if (includesAny(msg, ["manager", "who is the manager"])) {
    const managers = findStaffByRole(staff, ["manager"]);
    return {
      text:
        managers.length > 0
          ? `The manager listed in the system is ${formatAllStaff(managers)}.`
          : "I’m not seeing a manager record right now in the available data.",
    };
  }

  if (includesAny(msg, ["receptionist", "front desk"])) {
    const receptionists = findStaffByRole(staff, ["receptionist", "front desk"]);
    return {
      text:
        receptionists.length > 0
          ? `Our front desk team currently includes ${formatAllStaff(receptionists)}.`
          : "I’m not seeing front desk details right now in the available data.",
    };
  }

  if (
    includesAny(msg, [
      "contact",
      "email",
      "phone",
      "facebook",
      "social",
      "how can i contact",
    ])
  ) {
    return {
      text: pickRandom([
        "You may contact Ginhawa through the website contact page or the official communication channels listed there.",
        "For contact details, please visit the Contact page on the website. That section contains the official channels available.",
        "The best place to check our communication details is the Contact page of the website.",
      ]),
    };
  }

  if (
    includesAny(msg, [
      "location",
      "where",
      "address",
      "where are you located",
      "where is ginhawa",
    ])
  ) {
    return {
      text: pickRandom([
        "Our location details can be found on the Contact or About page of the website.",
        "Please check the Contact section for the location details currently posted on the website.",
        "The website’s Contact or About page should show the available location information.",
      ]),
    };
  }

  if (
    includesAny(msg, [
      "price",
      "prices",
      "cost",
      "how much",
      "rate",
      "rates",
      "pricing",
    ])
  ) {
    return {
      text: pickRandom([
        "Service pricing should be shown on the website. If exact prices are not visible yet, that information may still be under update.",
        "Pricing details are usually listed on the website. If you don’t see them yet, that part may still be incomplete.",
        "You can check the website for the latest prices. Some pricing information may still be under update.",
      ]),
    };
  }

  if (
    includesAny(msg, [
      "reward",
      "rewards",
      "badge",
      "badges",
      "points",
      "loyalty",
    ])
  ) {
    return {
      text: pickRandom([
        "Ginhawa includes a rewards and badge feature for customer engagement. Some reward details may still be under development.",
        "The platform includes rewards-related features such as badges and engagement tracking, although some parts may still be incomplete.",
        "Ginhawa supports a rewards system for customer engagement. Any missing details may still be under update.",
      ]),
    };
  }

  if (
    includesAny(msg, [
      "hours",
      "open",
      "opening",
      "closing",
      "what time",
      "schedule today",
    ])
  ) {
    return {
      text: pickRandom([
        "Please check the website schedule or contact page for the latest operating hours.",
        "Operating hours may depend on the current setup shown on the website, so the best reference is the Contact or booking section.",
        "For the latest opening hours, please refer to the website pages that show current scheduling information.",
      ]),
    };
  }

  if (
    includesAny(msg, [
      "who are you",
      "what are you",
      "are you ai",
      "what can you do",
      "ginhawa buddy",
    ])
  ) {
    return {
      text: pickRandom([
        "I’m Ginhawa Buddy, the website assistant for Ginhawa Spa & Wellness. I help answer common questions about the site, services, staff, and booking.",
        "I’m Ginhawa Buddy. I’m here to guide visitors through the website and help with general information such as booking, services, and staff.",
        "I’m Ginhawa Buddy, a website assistant designed to help with Ginhawa-related questions and guide users through the booking experience.",
      ]),
    };
  }

  return {
    text: pickRandom([
      "I’m sorry, but I don’t have complete information for that yet. That part of the system may still be under update.",
      "I’m not fully sure about that yet because some website information may still be incomplete.",
      "That information may still be under review or not yet available in the current Ginhawa system.",
    ]),
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

    const delay = getRandomReplyDelay(cleanText);

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