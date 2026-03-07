"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Sender = "user" | "bot";

type Message = {
  id: number;
  sender: Sender;
  text: string;
};

type ServiceItem = {
  name: string;
};

type StaffItem = {
  name: string;
  specialization: string;
  position: string;
};

const QUICK_REPLIES = [
  "Services",
  "Prices",
  "Staff",
  "Location",
];

function includesAny(text: string, keywords: string[]) {
  return keywords.some((word) => text.includes(word));
}

function randomAnswer(answers: string[]) {
  return answers[Math.floor(Math.random() * answers.length)];
}

function prettifyPosition(position: string) {
  return position.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatServices(services: ServiceItem[]) {
  if (services.length === 0) {
    return "massage services, facial treatments, and wellness services";
  }

  const names = services.map((s) => s.name);

  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function formatStaff(staff: StaffItem[]) {
  if (staff.length === 0) {
    return "our staff list is currently unavailable";
  }

  const names = staff.map((s) => `${s.name} (${prettifyPosition(s.position)})`);

  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function getBotReply(
  input: string,
  services: ServiceItem[],
  staff: StaffItem[]
): { text: string } {
  const msg = input.toLowerCase().trim();

  if (includesAny(msg, ["hello", "hi", "hey"])) {
    return {
      text: randomAnswer([
        "Hello. Welcome to Ginhawa Spa & Wellness. How may I help you today?",
        "Hi there. I'm here to help with information about our spa services.",
        "Welcome to Ginhawa. Feel free to ask about our services.",
        "Hello and welcome. What would you like to know today?",
        "Hi. I'm the Ginhawa assistant. How can I help you?",
        "Greetings. I'm here to answer your questions about our spa.",
      ]),
    };
  }

  if (includesAny(msg, ["service", "services", "offer", "treatment", "treatments"])) {
    return {
      text: randomAnswer([
        `We currently offer services such as ${formatServices(services)}.`,
        `Our spa treatments include ${formatServices(services)}.`,
        `You can explore services like ${formatServices(services)}.`,
        `Some of our available services include ${formatServices(services)}.`,
        `The spa currently provides ${formatServices(services)}.`,
        `Our wellness services include ${formatServices(services)}.`,
      ]),
    };
  }

  if (includesAny(msg, ["price", "prices", "cost", "how much", "rates", "rate"])) {
    return {
      text: randomAnswer([
        "Service prices vary depending on the treatment. You can view the full list on the services page.",
        "Pricing depends on the service selected. Please check the services section of the website.",
        "Each treatment has its own price which is listed on the services page.",
        "You can view the spa service prices directly on the website.",
        "The cost depends on the type of treatment you choose.",
        "Prices are listed on the services page where you can explore each treatment.",
      ]),
    };
  }

  if (includesAny(msg, ["staff", "team", "employee", "employees"])) {
    return {
      text: randomAnswer([
        `Our spa team includes ${formatStaff(staff)}.`,
        `These are the staff currently working at Ginhawa: ${formatStaff(staff)}.`,
        `Our wellness professionals include ${formatStaff(staff)}.`,
        `The spa staff members are ${formatStaff(staff)}.`,
        `Our team currently consists of ${formatStaff(staff)}.`,
        `The staff available at the spa are ${formatStaff(staff)}.`,
      ]),
    };
  }

  if (includesAny(msg, ["manager"])) {
    const managers = staff.filter((s) =>
      s.position.toLowerCase().includes("manager")
    );

    return {
      text: randomAnswer([
        `Our manager is ${formatStaff(managers)}.`,
        `Management is handled by ${formatStaff(managers)}.`,
        `The spa manager is ${formatStaff(managers)}.`,
        `Our current manager listed in the system is ${formatStaff(managers)}.`,
        `The manager responsible for the spa is ${formatStaff(managers)}.`,
        `Our management staff member is ${formatStaff(managers)}.`,
      ]),
    };
  }

  if (includesAny(msg, ["receptionist", "front desk"])) {
    const receptionists = staff.filter((s) =>
      s.position.toLowerCase().includes("receptionist")
    );

    return {
      text: randomAnswer([
        `Our receptionist is ${formatStaff(receptionists)}.`,
        `Front desk services are handled by ${formatStaff(receptionists)}.`,
        `The receptionist assisting visitors is ${formatStaff(receptionists)}.`,
        `Our front desk staff member is ${formatStaff(receptionists)}.`,
        `Reception duties are managed by ${formatStaff(receptionists)}.`,
        `Visitors are assisted by ${formatStaff(receptionists)} at the front desk.`,
      ]),
    };
  }

  if (includesAny(msg, ["therapist", "massage therapist", "massage therapists"])) {
    const therapists = staff.filter((s) =>
      s.position.toLowerCase().includes("therapist")
    );

    return {
      text: randomAnswer([
        `Our massage therapists are ${formatStaff(therapists)}.`,
        `Massage therapy is provided by ${formatStaff(therapists)}.`,
        `Our therapy professionals include ${formatStaff(therapists)}.`,
        `Massage services are handled by ${formatStaff(therapists)}.`,
        `Our massage therapy team consists of ${formatStaff(therapists)}.`,
        `The therapists currently available are ${formatStaff(therapists)}.`,
      ]),
    };
  }

  if (includesAny(msg, ["attendant", "attendants", "spa attendant"])) {
    const attendants = staff.filter((s) =>
      s.position.toLowerCase().includes("attendant")
    );

    return {
      text: randomAnswer([
        `Our spa attendants are ${formatStaff(attendants)}.`,
        `Attendant services are handled by ${formatStaff(attendants)}.`,
        `The attendants currently available are ${formatStaff(attendants)}.`,
        `Our spa support team includes ${formatStaff(attendants)}.`,
        `The spa attendants listed in our system are ${formatStaff(attendants)}.`,
        `Our attendant team consists of ${formatStaff(attendants)}.`,
      ]),
    };
  }

  if (includesAny(msg, ["massage", "stress", "relax", "body pain"])) {
    return {
      text: randomAnswer([
        "Massage services are available for relaxation and stress relief.",
        "Our massage treatments are designed to help with relaxation and muscle tension.",
        "You may explore our massage services for stress relief and wellness.",
        "Massage therapy is available to help with relaxation and body recovery.",
        "Many visitors choose our massage services for relaxation and tension relief.",
        "Our spa offers massage treatments that promote relaxation and wellness.",
      ]),
    };
  }

  if (includesAny(msg, ["facial", "skin", "face", "skincare", "skin care"])) {
    return {
      text: randomAnswer([
        "We offer facial treatments designed for skincare and facial wellness.",
        "Facial services are available to support healthy and refreshed skin.",
        "Our facial treatments focus on skincare and facial relaxation.",
        "You can explore our facial services for skin care and rejuvenation.",
        "Facial treatments are part of our wellness and skincare services.",
        "We provide facial services that support skin care and relaxation.",
      ]),
    };
  }

  if (includesAny(msg, ["location", "address", "where"])) {
    return {
      text: randomAnswer([
        "Our location details are available on the Contact page of the website.",
        "You can find our address on the website's contact section.",
        "The spa location is listed on the Contact page.",
        "Please check the Contact page for our address.",
        "Our address is available in the website’s contact section.",
        "You can view the spa location through the contact page.",
      ]),
    };
  }

  if (includesAny(msg, ["contact", "phone", "email"])) {
    return {
      text: randomAnswer([
        "You can find our contact details on the website's contact page.",
        "Our phone and email details are listed in the Contact section.",
        "Please refer to the Contact page for communication details.",
        "The website contains our official contact information.",
        "You may reach us using the details listed on the contact page.",
        "All contact information is available on the website.",
      ]),
    };
  }

  return {
    text: randomAnswer([
      "I can help answer questions about our spa services, staff, prices, or location.",
      "Please ask about services, staff, prices, or other spa information.",
      "You may ask questions about treatments, team members, or spa details.",
      "I'm here to provide information about Ginhawa Spa & Wellness.",
      "Feel free to ask about our services, staff, or spa information.",
      "You can ask about services, location, or wellness treatments.",
    ]),
  };
}

export default function GinhawaWixChat() {
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "bot",
      text: "Welcome to Ginhawa. How may I help you today?",
    },
  ]);

  const nextIdRef = useRef(2);
  const endRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    async function loadData() {
      const { data: serviceData } = await supabase
        .from("services")
        .select("name");

      if (Array.isArray(serviceData)) {
        const mappedServices: ServiceItem[] = serviceData
          .map((row: any) => ({
            name: String(row.name ?? "").trim(),
          }))
          .filter((s) => s.name.length > 0);

        setServices(mappedServices);
      }

      const { data: staffData } = await supabase
        .from("staff")
        .select("name, specialization, position")
        .order("name", { ascending: true });

      if (Array.isArray(staffData)) {
        const mappedStaff: StaffItem[] = staffData
          .map((row: any) => ({
            name: String(row.name ?? "").trim(),
            specialization: String(row.specialization ?? "").trim(),
            position: String(row.position ?? "").trim(),
          }))
          .filter((s) => s.name.length > 0);

        setStaff(mappedStaff);
      }
    }

    loadData();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function sendMessage(text: string) {
    const clean = text.trim();
    if (!clean) return;

    const userMsg: Message = {
      id: nextIdRef.current++,
      sender: "user",
      text: clean,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    timeoutRef.current = setTimeout(() => {
      const reply = getBotReply(clean, services, staff);

      const botMsg: Message = {
        id: nextIdRef.current++,
        sender: "bot",
        text: reply.text,
      };

      setMessages((prev) => [...prev, botMsg]);
      setTyping(false);
    }, 900);
  }

  return (
  <div
    style={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "stretch",
      justifyContent: "stretch",
      background: "transparent",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#f7f3ee",
        borderRadius: 0,
        overflow: "hidden",
        border: "none",
        boxShadow: "none",
      }}
    >
        <div
          style={{
            background: "linear-gradient(180deg,#9ab59d 0%,#88a98e 100%)",
            color: "#fff",
            padding: "14px 16px",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700 }}>Ginhawa Buddy</div>
          <div style={{ fontSize: 11, opacity: 0.92 }}>
            Wellness information assistant
          </div>
        </div>

        <div
  style={{
    flex: 1,
    padding: 12,
    overflowY: "auto",
    overflowX: "hidden",
    background: "#f7f3ee",
    minHeight: 0,
  }}
>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  maxWidth: "85%",
                  padding: "10px 12px",
                  borderRadius:
                    msg.sender === "user"
                      ? "16px 16px 8px 16px"
                      : "16px 16px 16px 8px",
                  background: msg.sender === "user" ? "#879f87" : "#ebe4d8",
                  color: msg.sender === "user" ? "#fff" : "#3f4d40",
                  fontSize: 13,
                  lineHeight: 1.4,
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
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  background: "#ebe4d8",
                  borderRadius: 18,
                  padding: "9px 12px",
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
            padding: 10,
            borderTop: "1px solid rgba(90,104,84,0.08)",
            background: "#f7f3ee",
          }}
        >
          <div
  style={{
    padding: 10,
    borderTop: "1px solid rgba(90,104,84,0.08)",
    background: "#f7f3ee",
    flexShrink: 0,
  }}
>
            {QUICK_REPLIES.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid #d6d1c7",
                  background: "#f0eadf",
                  cursor: "pointer",
                  fontSize: 11,
                  whiteSpace: "nowrap",
                  color: "#4a5648",
                  flexShrink: 0,
                }}
              >
                {q}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask here..."
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 999,
                border: "1px solid #d0cbc2",
                outline: "none",
                fontSize: 13,
                background: "#fffdfa",
                minWidth: 0,
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage(input);
              }}
            />

            <button
              onClick={() => sendMessage(input)}
              style={{
                padding: "0 14px",
                borderRadius: 999,
                border: "none",
                background: "#6f8f72",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              Send
            </button>
          </div>
        </div>

        <style jsx>{`
          .ginhawa-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #7f8d78;
            display: inline-block;
            animation: ginhawa-bounce 1.1s infinite ease-in-out;
          }

          .delay1 {
            animation-delay: 0.2s;
          }

          .delay2 {
            animation-delay: 0.4s;
          }

          @keyframes ginhawa-bounce {
            0%,
            80%,
            100% {
              transform: translateY(0);
              opacity: 0.4;
            }
            40% {
              transform: translateY(-4px);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </div>
  );
}