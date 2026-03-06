"use client";

import { useEffect, useRef, useState } from "react";

type Sender = "user" | "bot";

type Message = {
  id: number;
  sender: Sender;
  text: string;
};

const SITE_INFO = {
  businessName: "Ginhawa Spa & Wellness",
  assistantName: "Ginhawa Buddy",
  services: [
    "Massage Therapy",
    "Relaxation Treatment",
    "Wellness Consultation",
    "Spa Sessions",
  ],
  staff: [
    { name: "Airam Ricci", role: "Manager" },
    { name: "Franz Julian", role: "Receptionist" },
    { name: "David Russel", role: "Massage Therapist" },
    { name: "Yassy Kane", role: "Massage Therapist" },
    { name: "Linus Dominic", role: "Spa Attendant" },
    { name: "Sofia Bianca", role: "Spa Attendant" },
    { name: "Mary Avegail", role: "Spa Attendant" },
  ],
  contactEmail: "ginhawa@example.com",
  contactPhone: "+63 912 345 6789",
  facebook: "Ginhawa Spa & Wellness",
  location: "Location details are available on the Contact or About page.",
  hours: "Operating hours may vary based on the schedules posted on the website.",
  paymentMethods: ["Cash", "GCash"],
  websiteStatusNote:
    "Some website details may still be under update while the system is being completed.",
};

const QUICK_REPLIES = [
  "Services",
  "Book appointment",
  "Staff",
  "Rewards",
  "Referral code",
  "Contact",
];

function normalize(text: string) {
  return text.toLowerCase().replace(/[^\w\s]/g, "").trim();
}

function includesAny(msg: string, words: string[]) {
  return words.some((word) => msg.includes(word));
}

function formatList(items: string[]) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
function formatStaffList(
  staff: { name: string; role: string }[]
) {
  return staff.map((s) => `${s.name} (${s.role})`).join(", ");
}

function getBotReply(input: string): string {
  const msg = normalize(input);

  // greetings
  if (
    includesAny(msg, [
      "hi",
      "hello",
      "hey",
      "good morning",
      "good afternoon",
      "good evening",
    ])
  ) {
    return `Hello! I’m ${SITE_INFO.assistantName}. I can help you with services, booking, staff, rewards, referral, contact details, and other website information.`;
  }

  // chatbot identity
  if (
    includesAny(msg, [
      "who are you",
      "what are you",
      "what can you do",
      "are you ai",
      "are you real ai",
      "what is ginhawa buddy",
    ])
  ) {
    return `${SITE_INFO.assistantName} is the website assistant of ${SITE_INFO.businessName}. I help answer common questions about the website and spa services. Some answers may be limited if certain website data is still incomplete.`;
  }

  // business name / about
  if (
    includesAny(msg, [
      "what is ginhawa",
      "about ginhawa",
      "about your spa",
      "about the website",
      "who is ginhawa",
    ])
  ) {
    return `${SITE_INFO.businessName} is a wellness and booking platform where customers can explore services, schedule appointments, and engage with rewards and wellness-related features.`;
  }

  // services
  if (
    includesAny(msg, [
      "service",
      "services",
      "offer",
      "offers",
      "spa",
      "massage",
      "treatment",
      "what do you offer",
      "what are your services",
    ])
  ) {
    return `Our available services may include ${formatList(
      SITE_INFO.services
    )}. You can visit the Services page for the complete and updated list.`;
  }

  // pricing
  if (
    includesAny(msg, [
      "price",
      "prices",
      "rate",
      "rates",
      "cost",
      "how much",
      "pricing",
      "service fee",
    ])
  ) {
    return `Service pricing should be shown on the website pages related to each offering. If exact rates are not visible yet, pricing details may still be under update.`;
  }

  // booking
  if (
    includesAny(msg, [
      "book",
      "booking",
      "appointment",
      "reserve",
      "reservation",
      "schedule",
      "set appointment",
      "make appointment",
    ])
  ) {
    return `You can book an appointment by going to the Booking page, selecting your preferred service, date, and time, then confirming your request. The system may also prevent conflicts for unavailable schedules.`;
  }

  // cancel or reschedule
  if (
    includesAny(msg, [
      "cancel booking",
      "cancel appointment",
      "reschedule",
      "change appointment",
      "move appointment",
    ])
  ) {
    return `Appointment changes such as cancellation or rescheduling depend on the current website setup. If those controls are not yet visible, that feature may still be in development.`;
  }

  // staff
  if (
  includesAny(msg, [
    "staff",
    "staffs",
    "therapist",
    "therapists",
    "employee",
    "employees",
    "who are the staff",
    "who are your staff",
    "who are the staffs",
    "staff members",
    "who works here",
  ])
) {
  return `Our current staff members are ${formatStaffList(
    SITE_INFO.staff
  )}. Staff availability depends on the selected service and appointment schedule.`;
}

  // specific staff assignment
  if (
    includesAny(msg, [
      "who will assist me",
      "who is assigned",
      "assigned staff",
      "assigned therapist",
    ])
  ) {
    return `Assigned staff depends on the service and schedule selected during booking. The system should show available staff for your chosen appointment slot.`;
  }

  // hours
  if (
    includesAny(msg, [
      "hours",
      "opening hours",
      "open",
      "close",
      "closing time",
      "what time",
      "operating hours",
    ])
  ) {
    return SITE_INFO.hours;
  }

  // location
  if (
    includesAny(msg, [
      "location",
      "address",
      "where",
      "branch",
      "where are you located",
      "where is the spa",
    ])
  ) {
    return `${SITE_INFO.location} If exact details are still missing, ${SITE_INFO.websiteStatusNote.toLowerCase()}`;
  }

  // contact
  if (
    includesAny(msg, [
      "contact",
      "contacts",
      "email",
      "phone",
      "number",
      "facebook",
      "how can i contact you",
      "social media",
      "message you",
    ])
  ) {
    return `You may contact us through email at ${SITE_INFO.contactEmail}, phone at ${SITE_INFO.contactPhone}, or Facebook page ${SITE_INFO.facebook}. If any contact channel is not yet active, it may still be under setup.`;
  }

  // payment
  if (
    includesAny(msg, [
      "payment",
      "pay",
      "gcash",
      "cash",
      "card",
      "payment method",
      "how do i pay",
    ])
  ) {
    return `Current payment methods may include ${formatList(
      SITE_INFO.paymentMethods
    )}. If more payment options are not displayed yet, they may still be under development.`;
  }

  // rewards / badges
  if (
    includesAny(msg, [
      "badge",
      "badges",
      "reward",
      "rewards",
      "points",
      "milestone",
      "loyalty",
      "earn badges",
    ])
  ) {
    return `Ginhawa includes a milestone-based rewards feature where users may earn badges or benefits through completed bookings and wellness engagement.`;
  }

  // referral
  if (
    includesAny(msg, [
      "referral",
      "refer",
      "invite",
      "invite code",
      "referral code",
      "share code",
    ])
  ) {
    return `Referral features may be available for selected users. If your referral code or reward is not visible yet, the feature may still be under setup or pending activation.`;
  }

  // account / login / signup
  if (
    includesAny(msg, [
      "login",
      "log in",
      "sign in",
      "signup",
      "sign up",
      "register",
      "create account",
      "account",
    ])
  ) {
    return `You can create an account or log in through the authentication pages of the website. If you experience missing options or access issues, account-related features may still be undergoing adjustments.`;
  }

  // dashboard
  if (
    includesAny(msg, [
      "dashboard",
      "customer dashboard",
      "staff dashboard",
      "profile page",
      "my account",
    ])
  ) {
    return `The dashboard allows users to access account-related features such as bookings, profile information, rewards, and other tools depending on the role of the user.`;
  }

  // wellness activities
  if (
    includesAny(msg, [
      "wellness",
      "activities",
      "activity",
      "yoga",
      "pilates",
      "gym",
      "exercise",
      "self care",
    ])
  ) {
    return `Ginhawa may also include wellness-related activity suggestions such as yoga, pilates, gym sessions, or self-care recommendations depending on the content currently available on the site.`;
  }

  // AI assistant
  if (
    includesAny(msg, [
      "ai assistant",
      "buddy",
      "chatbot",
      "ginhawa buddy",
      "wellness assistant",
    ])
  ) {
    return `${SITE_INFO.assistantName} is designed to guide users around the website and answer common questions. If a topic requires data that has not yet been added, I will let you know politely.`;
  }

  // room / facility
  if (
    includesAny(msg, [
      "room",
      "rooms",
      "facility",
      "facilities",
      "spa room",
      "treatment room",
    ])
  ) {
    return `Room or facility information may be shown during the service or booking flow. If room details are not yet visible, that content may still be incomplete.`;
  }

  // availability
  if (
    includesAny(msg, [
      "available",
      "availability",
      "is there a slot",
      "free schedule",
      "open slot",
      "vacant",
    ])
  ) {
    return `Schedule availability depends on the selected service, date, time, and staff assignment. Please check the booking section for the latest available slots.`;
  }

  // promos / discounts
  if (
    includesAny(msg, [
      "promo",
      "promos",
      "discount",
      "discounts",
      "sale",
      "voucher",
      "coupon",
    ])
  ) {
    return `Promos or discounts may be announced through the website or official pages. If none are currently shown, there may be no active offers yet or the content may still be pending update.`;
  }

  // reviews / feedback
  if (
    includesAny(msg, [
      "review",
      "reviews",
      "feedback",
      "testimonials",
      "rating",
      "ratings",
    ])
  ) {
    return `Customer feedback and reviews may be available as part of the service quality section of the platform. If reviews are not visible yet, that area may still be under development.`;
  }

  // policies
  if (
    includesAny(msg, [
      "policy",
      "policies",
      "rules",
      "terms",
      "privacy",
      "privacy policy",
      "refund",
      "refund policy",
    ])
  ) {
    return `Policy-related information such as terms, privacy details, or refund rules should be available on the website if already published. If not, those pages may still be incomplete.`;
  }

  // admin
  if (
    includesAny(msg, [
      "admin",
      "administrator",
      "manage website",
      "who manages this",
      "website owner",
    ])
  ) {
    return `Administrative and management details are not always shown publicly on the website. For official concerns, please use the listed contact channels.`;
  }

  // thesis / prototype style questions
  if (
    includesAny(msg, [
      "is this real",
      "is this prototype",
      "is this demo",
      "is this final",
      "is this under development",
    ])
  ) {
    return `This website may still include prototype or developing features. Some sections can already demonstrate the intended flow, while others may still be incomplete.`;
  }

  // thanks
  if (
    includesAny(msg, [
      "thank you",
      "thanks",
      "ty",
      "thankyou",
    ])
  ) {
    return `You’re welcome. Let me know if you want help with services, booking, staff, rewards, or other Ginhawa website information.`;
  }

  // bye
  if (
    includesAny(msg, [
      "bye",
      "goodbye",
      "see you",
      "see ya",
    ])
  ) {
    return `Goodbye and thank you for visiting ${SITE_INFO.businessName}.`;
  }

  // fallback
  return `I’m sorry, but I don’t have complete website data for that yet. That information may still be under review, under update, or not yet available in the current ${SITE_INFO.businessName} system.`;
}

export default function GinhawaChatBubble() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "bot",
      text: `Hi! I’m ${SITE_INFO.assistantName}. Ask me about services, booking, staff, rewards, referral, contact details, and more.`,
    },
  ]);

  const nextIdRef = useRef(2);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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
    }, 700);
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
            fontFamily: "Inter, Arial, sans-serif",
          }}
        >
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
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                {SITE_INFO.assistantName}
              </div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>
                Website assistant
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
                    background: msg.sender === "user" ? "#7c6cff" : "#ecebff",
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
                  <span className="ginhawa-dot" />
                  <span className="ginhawa-dot delay1" />
                  <span className="ginhawa-dot delay2" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

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
        .ginhawa-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #8a84c9;
          display: inline-block;
          animation: ginhawa-bounce 1s infinite 0s;
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