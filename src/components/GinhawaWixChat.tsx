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
  "Swedish Massage",
  "Classic Facial",
];

function includesAny(text: string, keywords: string[]) {
  return keywords.some((word) => text.includes(word));
}

function randomAnswer(answers: string[]) {
  return answers[Math.floor(Math.random() * answers.length)];
}

function normalizeText(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
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

function serviceMatches(msg: string, serviceName: string) {
  const a = normalizeText(msg);
  const b = normalizeText(serviceName);
  return a.includes(b);
}

function getServiceSpecificReply(input: string): { text: string } | null {
  const msg = normalizeText(input);

  const serviceReplies: Record<string, string[]> = {
    "swedish massage": [
      "Swedish Massage is a relaxing full-body massage that uses gentle and flowing strokes to help reduce stress and promote relaxation.",
      "Our Swedish Massage is ideal for guests who want a soothing and calming treatment for overall body relaxation.",
      "Swedish Massage focuses on comfort and relaxation, making it a great choice for easing everyday stress.",
      "If you want a classic relaxing massage experience, Swedish Massage is one of our most soothing treatment options.",
    ],
    "swedish massage extra": [
      "Swedish Massage Extra is an extended version of our Swedish Massage, giving you more time to relax and unwind.",
      "This treatment provides the same gentle and soothing Swedish Massage experience but with a longer session.",
      "Swedish Massage Extra is ideal for guests who want a more extended calming and relaxing massage.",
      "If you prefer a longer full-body relaxation session, Swedish Massage Extra is a great option.",
    ],
    "deep tissue massage": [
      "Deep Tissue Massage uses firmer pressure to target body tension and tight muscles.",
      "Our Deep Tissue Massage is ideal for guests who prefer stronger pressure for muscle relief and body comfort.",
      "This treatment focuses on deeper muscle layers to help reduce built-up tension and stiffness.",
      "Deep Tissue Massage is a good choice if you want a stronger massage for body stress and muscle tightness.",
    ],
    "deep tissue massage extra": [
      "Deep Tissue Massage Extra is a longer deep-pressure massage session designed for more focused muscle relief.",
      "This service gives you an extended Deep Tissue Massage experience for deeper body tension care.",
      "Deep Tissue Massage Extra is ideal for those who want strong pressure with more time spent on tight areas.",
      "If you want a longer massage session focused on body tension and stiffness, Deep Tissue Massage Extra is a strong option.",
    ],
    "hot stone massage": [
      "Hot Stone Massage combines massage techniques with warm stones to create a deeply relaxing experience.",
      "This treatment uses soothing heat and massage to help the body feel calm, comforted, and refreshed.",
      "Hot Stone Massage is a popular choice for guests who enjoy warmth together with relaxation.",
      "If you want a calming treatment with gentle warmth, Hot Stone Massage is one of our relaxing options.",
    ],
    "aromatherapy massage": [
      "Aromatherapy Massage combines relaxing massage techniques with aromatic oils for a calming spa experience.",
      "This treatment is designed to promote relaxation through gentle massage and soothing scents.",
      "Aromatherapy Massage is ideal for guests who enjoy a peaceful massage with fragrant oils.",
      "If you want a relaxing massage with aromatic wellness elements, Aromatherapy Massage is a great option.",
    ],
    "classic facial": [
      "Classic Facial is a basic facial treatment designed to cleanse and refresh the skin.",
      "Our Classic Facial is a gentle skincare service that helps the face feel clean and revitalized.",
      "This treatment is ideal for guests who want simple and refreshing facial care.",
      "Classic Facial is a good choice if you want a relaxing facial that supports basic skincare.",
    ],
    "brightening facial": [
      "Brightening Facial is designed to help the skin look fresher, clearer, and more radiant.",
      "This treatment focuses on improving the appearance of dull-looking skin for a refreshed glow.",
      "Brightening Facial is ideal for guests who want a more luminous and revitalized facial look.",
      "If you want a facial that helps promote a brighter-looking complexion, Brightening Facial is a good choice.",
    ],
    "acne control facial": [
      "Acne Control Facial is a skincare treatment focused on helping care for acne-prone skin.",
      "This facial is ideal for guests who want targeted care for oily or blemish-prone skin.",
      "Acne Control Facial supports cleaner and healthier-looking skin through focused facial treatment.",
      "If you are looking for a facial for acne-prone skin, Acne Control Facial is one of our available services.",
    ],
    "anti-aging facial": [
      "Anti-Aging Facial is designed to help the skin feel refreshed and support a more youthful-looking appearance.",
      "This treatment focuses on facial care that promotes a smoother and revitalized look.",
      "Anti-Aging Facial is a great option for guests who want refreshing skincare with a rejuvenating feel.",
      "If you want a facial focused on skin renewal and a refreshed appearance, Anti-Aging Facial is a good choice.",
    ],
    "body scrub": [
      "Body Scrub is a skin treatment that helps exfoliate the body and leave the skin feeling smoother.",
      "This service removes surface dullness and helps refresh the skin for a softer feel.",
      "Body Scrub is ideal for guests who want a rejuvenating treatment that improves skin texture.",
      "If you want a refreshing exfoliation treatment, Body Scrub is one of our body care options.",
    ],
    "detox body wrap": [
      "Detox Body Wrap is a relaxing body treatment designed to leave you feeling refreshed and pampered.",
      "This service provides a soothing body wrap experience focused on comfort and body care.",
      "Detox Body Wrap is chosen by guests who want a calm and refreshing body wellness treatment.",
      "If you want a body treatment that feels soothing and restorative, Detox Body Wrap is a good option.",
    ],
    "slimming therapy": [
      "Slimming Therapy is one of our body wellness treatments designed for clients exploring body care options.",
      "This service is intended for guests who are interested in body-focused wellness treatments.",
      "Slimming Therapy is offered as part of our body care and spa service lineup.",
      "If you are looking into body wellness treatments, Slimming Therapy is one of the available services.",
    ],
    "manicure": [
      "Manicure is a hand and nail care treatment that helps keep the nails neat and well-groomed.",
      "Our Manicure service focuses on hand care and improving the appearance of the nails.",
      "This treatment is ideal for guests who want tidy, clean, and polished-looking nails.",
      "If you want a simple grooming service for your hands and nails, Manicure is a great choice.",
    ],
    "pedicure": [
      "Pedicure is a foot and nail care treatment that helps keep the feet clean, neat, and refreshed.",
      "Our Pedicure service focuses on toenail grooming and overall foot care.",
      "This treatment is ideal for guests who want well-maintained feet and toenails.",
      "If you want a relaxing grooming treatment for your feet, Pedicure is a good option.",
    ],
    "gel polish": [
      "Gel Polish is a nail treatment that gives the nails a smooth and polished finish.",
      "This service is ideal for guests who want a neat and refined nail appearance.",
      "Gel Polish helps enhance the look of the nails with a clean and attractive finish.",
      "If you want your nails to look polished and stylish, Gel Polish is a great option.",
    ],
    "foot spa": [
      "Foot Spa is a relaxing treatment designed to soothe and refresh tired feet.",
      "This service provides focused foot care to help your feet feel calm and comfortable.",
      "Foot Spa is a great choice for guests who want to unwind and enjoy a soothing foot treatment.",
      "If your feet feel tired and you want a calming service, Foot Spa is one of our relaxing options.",
    ],
    "foot reflexology": [
      "Foot Reflexology is a relaxing foot treatment that applies focused pressure to different areas of the feet.",
      "This service is ideal for guests who enjoy pressure-based foot relaxation treatments.",
      "Foot Reflexology provides a soothing experience designed to help the feet feel relaxed and cared for.",
      "If you want a focused foot treatment with pressure techniques, Foot Reflexology is a good option.",
    ],
    "head massage": [
      "Head Massage is a soothing treatment designed to help ease stress and promote relaxation.",
      "This service focuses on the head area to provide a calming and refreshing experience.",
      "Head Massage is ideal for guests who want a quick but relaxing treatment.",
      "If you want a gentle and calming stress-relief service, Head Massage is a great option.",
    ],
    "back scrub": [
      "Back Scrub is a skin treatment that helps exfoliate and refresh the back area.",
      "This service removes surface dullness and helps the back feel smoother and cleaner.",
      "Back Scrub is ideal for guests who want targeted back skin care and refreshment.",
      "If you want a body care treatment focused on the back, Back Scrub is a good option.",
    ],
  };

  for (const serviceName of Object.keys(serviceReplies)) {
    if (serviceMatches(msg, serviceName)) {
      return {
        text: randomAnswer(serviceReplies[serviceName]),
      };
    }
  }

  return null;
}

function matchesStaffName(msg: string, staffName: string) {
  return normalizeText(msg).includes(normalizeText(staffName));
}

function getStaffSpecificReply(input: string, staff: StaffItem[]): { text: string } | null {
  const msg = normalizeText(input);

  for (const member of staff) {
    const name = String(member.name ?? "").trim();
    const specialization = String(member.specialization ?? "").trim();
    const position = String(member.position ?? "").trim();

    if (!name) continue;

    if (matchesStaffName(msg, name)) {
      const readablePosition = prettifyPosition(position || "staff");
      const specText = specialization || "general wellness services";

      return {
        text: randomAnswer([
          `${name} is part of our team and works as a ${readablePosition.toLowerCase()}.`,
          `${name} is one of our staff members at Ginhawa Spa & Wellness and serves as a ${readablePosition.toLowerCase()}.`,
          `${name} is a ${readablePosition.toLowerCase()} at Ginhawa and is associated with ${specText}.`,
          `${name} is one of our spa staff members, serving as a ${readablePosition.toLowerCase()} and helping with ${specText}.`,
        ]),
      };
    }
  }

  if (includesAny(msg, ["manager"])) {
    const managers = staff.filter((s) =>
      String(s.position ?? "").toLowerCase().includes("manager")
    );

    if (managers.length > 0) {
      return {
        text: randomAnswer([
          `Our manager is ${formatStaff(managers)}.`,
          `Management at Ginhawa is handled by ${formatStaff(managers)}.`,
          `The manager listed in our system is ${formatStaff(managers)}.`,
          `Our current management staff member is ${formatStaff(managers)}.`,
        ]),
      };
    }

    return {
      text: randomAnswer([
        "Our manager information is currently unavailable.",
        "I cannot find a manager listed right now.",
        "The manager details are not available at the moment.",
        "Our management record is currently unavailable.",
      ]),
    };
  }

  if (includesAny(msg, ["receptionist", "front desk"])) {
    const receptionists = staff.filter((s) =>
      String(s.position ?? "").toLowerCase().includes("receptionist")
    );

    if (receptionists.length > 0) {
      return {
        text: randomAnswer([
          `Our receptionist is ${formatStaff(receptionists)}.`,
          `Front desk assistance is handled by ${formatStaff(receptionists)}.`,
          `The receptionist currently assisting guests is ${formatStaff(receptionists)}.`,
          `Our front desk staff member is ${formatStaff(receptionists)}.`,
        ]),
      };
    }

    return {
      text: randomAnswer([
        "Our receptionist information is currently unavailable.",
        "I cannot find a receptionist listed right now.",
        "The front desk details are not available at the moment.",
        "Our receptionist record is currently unavailable.",
      ]),
    };
  }

  if (includesAny(msg, ["therapist", "massage therapist", "massage therapists"])) {
    const therapists = staff.filter((s) =>
      String(s.position ?? "").toLowerCase().includes("therapist")
    );

    if (therapists.length > 0) {
      return {
        text: randomAnswer([
          `Our massage therapists are ${formatStaff(therapists)}.`,
          `Massage therapy services are handled by ${formatStaff(therapists)}.`,
          `The therapists currently available are ${formatStaff(therapists)}.`,
          `Our therapy team includes ${formatStaff(therapists)}.`,
        ]),
      };
    }

    return {
      text: randomAnswer([
        "Our therapist information is currently unavailable.",
        "I cannot find a therapist listed right now.",
        "The therapist details are not available at the moment.",
        "Our therapy team record is currently unavailable.",
      ]),
    };
  }

  if (includesAny(msg, ["attendant", "attendants", "spa attendant"])) {
    const attendants = staff.filter((s) =>
      String(s.position ?? "").toLowerCase().includes("attendant")
    );

    if (attendants.length > 0) {
      return {
        text: randomAnswer([
          `Our spa attendants are ${formatStaff(attendants)}.`,
          `Attendant services are handled by ${formatStaff(attendants)}.`,
          `The attendants currently available are ${formatStaff(attendants)}.`,
          `Our spa support team includes ${formatStaff(attendants)}.`,
        ]),
      };
    }

    return {
      text: randomAnswer([
        "Our attendant information is currently unavailable.",
        "I cannot find an attendant listed right now.",
        "The attendant details are not available at the moment.",
        "Our support team record is currently unavailable.",
      ]),
    };
  }

  return null;
}

function getBotReply(
  input: string,
  services: ServiceItem[],
  staff: StaffItem[]
): { text: string } {
  const msg = input.toLowerCase().trim();

  const specificStaffReply = getStaffSpecificReply(input, staff);
  if (specificStaffReply) return specificStaffReply;

  const specificServiceReply = getServiceSpecificReply(input);
  if (specificServiceReply) return specificServiceReply;

  if (includesAny(msg, ["hello", "hi", "hey"])) {
    return {
      text: randomAnswer([
        "Hello. Welcome to Ginhawa Spa & Wellness. How may I assist you today?",
        "Hi there. I'm here to help with information about our spa services.",
        "Welcome to Ginhawa. Feel free to ask about our services.",
        "Hello and welcome. What would you like to know today?",
        "Hi. I'm the Ginhawa assistant. How can I help you today?",
        "Greetings. I'm here to answer your questions about our spa.",
      ]),
    };
  }
  if (includesAny(msg, ["back pain", "lower back pain", "upper back pain"])) {
  return {
    text: randomAnswer([
      "For back pain, many guests choose Deep Tissue Massage or Hot Stone Massage because they focus on relieving deeper muscle tension in the back.",
      "If you're experiencing back discomfort, Deep Tissue Massage or Swedish Massage may help relax tight back muscles.",
      "Back pain is often addressed with treatments like Deep Tissue Massage or Hot Stone Massage which help ease muscle stress.",
      "For back muscle tension, services like Deep Tissue Massage or Swedish Massage are commonly recommended for relaxation.",
    ]),
  };
}

// NECK PAIN
if (includesAny(msg, ["neck pain", "stiff neck"])) {
  return {
    text: randomAnswer([
      "For neck tension, many guests explore Swedish Massage or Aromatherapy Massage to help relax the neck and shoulder area.",
      "Neck stiffness can sometimes be relieved through relaxing treatments like Swedish Massage or Head Massage.",
      "If you're feeling neck discomfort, services like Swedish Massage or Aromatherapy Massage may help promote relaxation.",
      "For neck muscle tension, a relaxing massage such as Swedish Massage is often chosen by guests.",
    ]),
  };
}

// SHOULDER PAIN
if (includesAny(msg, ["shoulder pain", "shoulder tension"])) {
  return {
    text: randomAnswer([
      "Shoulder tension is often addressed through treatments like Deep Tissue Massage or Swedish Massage.",
      "If you are experiencing shoulder discomfort, Deep Tissue Massage may help focus on tight shoulder muscles.",
      "For shoulder muscle stress, Swedish Massage or Deep Tissue Massage are common relaxation options.",
      "Many guests with shoulder tension choose Deep Tissue Massage for deeper muscle relaxation.",
    ]),
  };
}

// HEADACHE
if (includesAny(msg, ["headache", "head pain", "migraine"])) {
  return {
    text: randomAnswer([
      "For headaches or head tension, Head Massage or Aromatherapy Massage may help create a calming experience.",
      "Some guests choose Head Massage when experiencing tension around the head and scalp.",
      "Head Massage or Aromatherapy Massage are relaxing treatments often explored for head stress.",
      "If you have head tension, Head Massage is a soothing option available at the spa.",
    ]),
  };
}

// FOOT PAIN
if (includesAny(msg, ["foot pain", "feet pain", "tired feet", "aching feet"])) {
  return {
    text: randomAnswer([
      "For tired or aching feet, Foot Spa or Foot Reflexology are relaxing treatments designed for foot comfort.",
      "If your feet feel sore, many guests explore Foot Reflexology or Foot Spa for relaxation.",
      "Foot Reflexology focuses on pressure points in the feet and is often chosen for foot fatigue.",
      "For tired feet, Foot Spa or Foot Reflexology are commonly recommended treatments.",
    ]),
  };
}

// BODY SORENESS
if (includesAny(msg, ["body pain", "muscle pain", "sore body", "body soreness"])) {
  return {
    text: randomAnswer([
      "For general body soreness, services like Swedish Massage, Deep Tissue Massage, or Hot Stone Massage may help promote relaxation.",
      "If your body feels sore or tense, Swedish Massage or Deep Tissue Massage are common relaxation treatments.",
      "General muscle discomfort is often addressed through Swedish Massage or Aromatherapy Massage.",
      "For overall body tension, treatments like Deep Tissue Massage or Hot Stone Massage may help ease muscle stress.",
    ]),
  };
}

// STRESS / FATIGUE
if (includesAny(msg, ["stress", "tired", "fatigue", "burnout"])) {
  return {
    text: randomAnswer([
      "For stress and fatigue, relaxing treatments like Aromatherapy Massage or Swedish Massage are commonly explored.",
      "Many guests experiencing stress choose Aromatherapy Massage for its calming and relaxing spa experience.",
      "If you're feeling tired or mentally stressed, Swedish Massage or Hot Stone Massage may help promote relaxation.",
      "For relaxation and stress relief, Aromatherapy Massage or Swedish Massage are popular choices.",
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

  if (includesAny(msg, ["massage", "stress", "relax", "body pain"])) {
    return {
      text: randomAnswer([
        "Massage services are available for relaxation and stress relief.",
        "Our massage treatments are designed to help with relaxation and muscle tension.",
        "You may explore our massage services for stress relief and wellness.",
        "Massage therapy is available to help with relaxation and body recovery.",
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
      ]),
    };
  }

 if (includesAny(msg, ["location", "address", "where", "located"])) {
  return {
    text: randomAnswer([
      "Our spa is located at Sampaloc, Manila, Philippines.",
      "You can find Ginhawa Spa & Wellness at Sampaloc, Manila, Philippines.",
      "Our spa location is Sampaloc, Manila, Philippines.",
      "Ginhawa Spa & Wellness is located in Sampaloc, Manila, Philippines.",
    ]),
  };
}

if (includesAny(msg, ["contact", "phone", "email", "number", "call"])) {
  return {
    text: randomAnswer([
      "You can contact Ginhawa Spa & Wellness through the following details:\n\nAddress: Sampaloc, Manila, Philippines\nContact Number: 09682748775\nEmail Address: ginhawa@gmail.com",
      "Here are our contact details:\n\nAddress: Sampaloc, Manila, Philippines\nContact Number: 09682748775\nEmail Address: ginhawa@gmail.com",
      "You may reach us using these details:\n\nAddress: Sampaloc, Manila, Philippines\nContact Number: 09682748775\nEmail Address: ginhawa@gmail.com",
      "For inquiries, please use the following contact information:\n\nAddress: Sampaloc, Manila, Philippines\nContact Number: 09682748775\nEmail Address: ginhawa@gmail.com",
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
        .select("name")
        .order("name", { ascending: true });

      if (Array.isArray(serviceData)) {
        setServices(
          serviceData
            .map((row: any) => ({
              name: String(row.name ?? "").trim(),
            }))
            .filter((s) => s.name.length > 0)
        );
      }

      const { data: staffData } = await supabase
        .from("staff")
        .select("name, specialization, position")
        .order("name", { ascending: true });

      if (Array.isArray(staffData)) {
        setStaff(
          staffData
            .map((row: any) => ({
              name: String(row.name ?? "").trim(),
              specialization: String(row.specialization ?? "").trim(),
              position: String(row.position ?? "").trim(),
            }))
            .filter((s) => s.name.length > 0)
        );
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
    }, 850);
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#f7f3ee",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: "linear-gradient(180deg,#9ab59d 0%,#88a98e 100%)",
          color: "#fff",
          padding: "14px 16px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.1 }}>
          Ginhawa Buddy
        </div>
        <div style={{ fontSize: 11, opacity: 0.92, marginTop: 4 }}>
          Wellness information assistant
        </div>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "14px 12px 8px",
          background: "#f7f3ee",
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
                maxWidth: "84%",
                padding: "10px 12px",
                borderRadius:
                  msg.sender === "user"
                    ? "16px 16px 8px 16px"
                    : "16px 16px 16px 8px",
                background: msg.sender === "user" ? "#879f87" : "#ebe4d8",
                color: msg.sender === "user" ? "#fff" : "#3f4d40",
                fontSize: 13,
                lineHeight: 1.45,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                boxShadow:
                  msg.sender === "user"
                    ? "0 4px 10px rgba(111,143,114,0.14)"
                    : "0 4px 10px rgba(70,80,60,0.05)",
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {typing && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
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
          padding: "10px 12px 12px",
          borderTop: "1px solid rgba(90,104,84,0.08)",
          background: "#f7f3ee",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 8,
            overflowX: "auto",
            paddingBottom: 2,
          }}
        >
          {QUICK_REPLIES.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              style={{
                padding: "6px 11px",
                borderRadius: 999,
                border: "1px solid #d7d0c3",
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

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask here..."
            style={{
              flex: 1,
              minWidth: 0,
              height: 42,
              padding: "0 14px",
              borderRadius: 999,
              border: "1px solid #d0cbc2",
              outline: "none",
              fontSize: 13,
              background: "#fffdfa",
              color: "#3f4d40",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage(input);
            }}
          />

          <button
            onClick={() => sendMessage(input)}
            style={{
              height: 42,
              padding: "0 16px",
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
  );
}