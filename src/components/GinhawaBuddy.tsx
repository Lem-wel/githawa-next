"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  forceOpen?: boolean;
};

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
  "How can I contact you?",
];

function prettyRole(role: string) {
  return role.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((word) => text.includes(word));
}

function formatStaff(staff: StaffItem[]) {
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
  const msg = input.toLowerCase().trim();

  if (
    includesAny(msg, ["hello", "hi", "hey", "good morning", "good afternoon"])
  ) {
    return {
      text: randomAnswer([
        "Hello! I'm Ginhawa Buddy. How may I assist you today?",
        "Hi there. I'm here to help you explore Ginhawa services or bookings.",
        "Welcome! Feel free to ask about services, booking, or our staff.",
        "Hello and welcome to Ginhawa. What would you like to know today?",
        "Hi! I'm the Ginhawa website assistant. How can I help?",
      ]),
    };
  }

  if (
    includesAny(msg, [
      "who is the manager",
      "who are the managers",
      "manager",
      "management",
    ])
  ) {
    const managers = findStaffByRole(staff, ["manager", "management"]);

    return {
      text:
        managers.length > 0
          ? randomAnswer([
              `Our manager is ${formatStaff(managers)}.`,
              `The manager listed in the system is ${formatStaff(managers)}.`,
              `Currently, the manager in our staff list is ${formatStaff(managers)}.`,
              `The manager recorded in the system is ${formatStaff(managers)}.`,
              `The staff member assigned to management is ${formatStaff(managers)}.`,
            ])
          : randomAnswer([
              "I’m not seeing a manager record right now in the available data.",
              "The manager details are not currently available in the system.",
              "I can’t find a manager record at the moment.",
              "The management information may still be updating right now.",
            ]),
    };
  }

  if (
    includesAny(msg, [
      "who is the receptionist",
      "who are the receptionists",
      "receptionist",
      "receptionists",
      "front desk",
    ])
  ) {
    const receptionists = findStaffByRole(staff, ["receptionist", "front desk"]);

    return {
      text:
        receptionists.length > 0
          ? randomAnswer([
              `Our receptionist team includes ${formatStaff(receptionists)}.`,
              `The front desk staff currently listed are ${formatStaff(receptionists)}.`,
              `Our receptionist staff are ${formatStaff(receptionists)}.`,
              `The reception team in the system includes ${formatStaff(receptionists)}.`,
              `The staff assigned to front desk duties are ${formatStaff(receptionists)}.`,
            ])
          : randomAnswer([
              "I’m not seeing receptionist details right now in the available data.",
              "The front desk staff details are not currently available.",
              "I can’t find receptionist information at the moment.",
              "The receptionist records may still be updating in the system.",
            ]),
    };
  }

  if (
    includesAny(msg, [
      "who are the massage therapists",
      "who is the massage therapist",
      "massage therapist",
      "massage therapists",
      "therapist",
      "therapists",
    ])
  ) {
    const therapists = findStaffByRole(staff, [
      "massage therapist",
      "therapist",
      "massage",
    ]);

    return {
      text:
        therapists.length > 0
          ? randomAnswer([
              `Our massage therapists are ${formatStaff(therapists)}.`,
              `The therapists currently listed in the system are ${formatStaff(therapists)}.`,
              `Our massage therapy team includes ${formatStaff(therapists)}.`,
              `The staff assigned under massage therapy are ${formatStaff(therapists)}.`,
              `These are the massage therapists currently available in our staff list: ${formatStaff(therapists)}.`,
            ])
          : randomAnswer([
              "I’m not seeing therapist details right now. That information may still be under update in the system.",
              "The massage therapist information is not currently available.",
              "I can’t find therapist records at the moment.",
              "The therapist data may still be syncing in the system.",
            ]),
    };
  }

  if (
    includesAny(msg, [
      "who are the attendants",
      "who is the attendant",
      "spa attendant",
      "spa attendants",
      "attendant",
      "attendants",
    ])
  ) {
    const attendants = findStaffByRole(staff, ["spa attendant", "attendant"]);

    return {
      text:
        attendants.length > 0
          ? randomAnswer([
              `Our spa attendants are ${formatStaff(attendants)}.`,
              `The attendants currently listed in the system are ${formatStaff(attendants)}.`,
              `Our spa attendant team includes ${formatStaff(attendants)}.`,
              `The staff assigned as attendants are ${formatStaff(attendants)}.`,
              `These are the attendants recorded in our system: ${formatStaff(attendants)}.`,
            ])
          : randomAnswer([
              "I’m not seeing attendant details right now in the available data.",
              "The attendant information is not currently available.",
              "I can’t find attendant records at the moment.",
              "The spa attendant details may still be updating in the system.",
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
      "who are your staff",
      "who are the staff",
    ])
  ) {
    return {
      text:
        staff.length > 0
          ? randomAnswer([
              `Our current team includes ${formatStaff(staff)}.`,
              `Here are all the staff members currently listed: ${formatStaff(staff)}.`,
              `The Ginhawa team includes ${formatStaff(staff)}.`,
              `Our full staff list currently includes ${formatStaff(staff)}.`,
              `These are the staff members registered in the system: ${formatStaff(staff)}.`,
            ])
          : randomAnswer([
              "It seems the staff information is still being updated in the system.",
              "I can't retrieve the staff list right now. The system may still be loading the data.",
              "Our staff list is currently unavailable, but it should appear soon once the system finishes updating.",
              "The staff information may still be syncing in the database.",
            ]),
    };
  }

  if (includesAny(msg, ["contact", "phone", "number", "email", "call"])) {
    return {
      text: randomAnswer([
        "You may contact Ginhawa Spa & Wellness through the following details:\n\nAddress: Sampaloc, Manila, Philippines\nContact Number: 09682748775\nEmail Address: ginhawa@gmail.com",
        "Here are the official contact details of Ginhawa Spa & Wellness:\n\nAddress: Sampaloc, Manila, Philippines\nContact Number: 09682748775\nEmail Address: ginhawa@gmail.com",
        "For inquiries, you may reach us through:\n\nAddress: Sampaloc, Manila, Philippines\nContact Number: 09682748775\nEmail Address: ginhawa@gmail.com",
        "You can reach Ginhawa Spa & Wellness using these details:\n\nAddress: Sampaloc, Manila, Philippines\nContact Number: 09682748775\nEmail Address: ginhawa@gmail.com",
      ]),
    };
  }

  if (includesAny(msg, ["location", "where", "address", "located"])) {
    return {
      text: randomAnswer([
        "Ginhawa Spa & Wellness is located at Sampaloc, Manila, Philippines.",
        "Our spa is located in Sampaloc, Manila, Philippines.",
        "You can find Ginhawa Spa & Wellness at Sampaloc, Manila, Philippines.",
        "Our address is Sampaloc, Manila, Philippines.",
      ]),
    };
  }

  if (
    includesAny(msg, [
      "discount",
      "discounts",
      "promo",
      "promotion",
      "sale",
      "voucher",
      "coupon",
      "cheaper",
      "deal",
    ])
  ) {
    return {
      text: randomAnswer([
        "Ginhawa Spa & Wellness provides discounts through our badge rewards system. As clients continue using the platform, they may earn badges that sometimes unlock special discounts.",
        "Instead of regular promotions, Ginhawa uses a badge system where users can earn rewards that may include service discounts.",
        "Our website includes a badge rewards feature where customers may receive discounts after earning certain badges.",
        "Discounts are often provided through the badge reward system once users achieve specific milestones.",
      ]),
    };
  }

  if (msg.includes("swedish massage extra")) {
    return {
      text: randomAnswer([
        "Swedish Massage Extra is an extended version of our Swedish Massage, giving you more time to relax and unwind.",
        "This treatment provides the same gentle and soothing Swedish Massage experience but with a longer session.",
        "Swedish Massage Extra is ideal for guests who want a more extended calming and relaxing massage.",
        "If you prefer a longer full-body relaxation session, Swedish Massage Extra is a great option.",
      ]),
    };
  }

  if (msg.includes("swedish massage")) {
    return {
      text: randomAnswer([
        "Swedish Massage is a relaxing full-body massage that uses gentle and flowing strokes to help reduce stress and promote relaxation.",
        "Our Swedish Massage is ideal for guests who want a soothing and calming treatment for overall body relaxation.",
        "Swedish Massage focuses on comfort and relaxation, making it a great choice for easing everyday stress.",
        "If you want a classic relaxing massage experience, Swedish Massage is one of our most soothing treatment options.",
      ]),
    };
  }

  if (msg.includes("deep tissue massage extra")) {
    return {
      text: randomAnswer([
        "Deep Tissue Massage Extra is a longer deep-pressure massage session designed for more focused muscle relief.",
        "This service gives you an extended Deep Tissue Massage experience for deeper body tension care.",
        "Deep Tissue Massage Extra is ideal for those who want strong pressure with more time spent on tight areas.",
        "If you want a longer massage session focused on body tension and stiffness, Deep Tissue Massage Extra is a strong option.",
      ]),
    };
  }

  if (msg.includes("deep tissue massage")) {
    return {
      text: randomAnswer([
        "Deep Tissue Massage uses firmer pressure to target body tension and tight muscles.",
        "Our Deep Tissue Massage is ideal for guests who prefer stronger pressure for muscle relief and body comfort.",
        "This treatment focuses on deeper muscle layers to help reduce built-up tension and stiffness.",
        "Deep Tissue Massage is a good choice if you want a stronger massage for body stress and muscle tightness.",
      ]),
    };
  }

  if (msg.includes("hot stone massage")) {
    return {
      text: randomAnswer([
        "Hot Stone Massage combines massage techniques with warm stones to create a deeply relaxing experience.",
        "This treatment uses soothing heat and massage to help the body feel calm, comforted, and refreshed.",
        "Hot Stone Massage is a popular choice for guests who enjoy warmth together with relaxation.",
        "If you want a calming treatment with gentle warmth, Hot Stone Massage is one of our relaxing options.",
      ]),
    };
  }

  if (msg.includes("aromatherapy massage")) {
    return {
      text: randomAnswer([
        "Aromatherapy Massage combines relaxing massage techniques with aromatic oils for a calming spa experience.",
        "This treatment is designed to promote relaxation through gentle massage and soothing scents.",
        "Aromatherapy Massage is ideal for guests who enjoy a peaceful massage with fragrant oils.",
        "If you want a relaxing massage with aromatic wellness elements, Aromatherapy Massage is a great option.",
      ]),
    };
  }

  if (msg.includes("classic facial")) {
    return {
      text: randomAnswer([
        "Classic Facial is a basic facial treatment designed to cleanse and refresh the skin.",
        "Our Classic Facial is a gentle skincare service that helps the face feel clean and revitalized.",
        "This treatment is ideal for guests who want simple and refreshing facial care.",
        "Classic Facial is a good choice if you want a relaxing facial that supports basic skincare.",
      ]),
    };
  }

  if (msg.includes("brightening facial")) {
    return {
      text: randomAnswer([
        "Brightening Facial is designed to help the skin look fresher, clearer, and more radiant.",
        "This treatment focuses on improving the appearance of dull-looking skin for a refreshed glow.",
        "Brightening Facial is ideal for guests who want a more luminous and revitalized facial look.",
        "If you want a facial that helps promote a brighter-looking complexion, Brightening Facial is a good choice.",
      ]),
    };
  }

  if (msg.includes("acne control facial")) {
    return {
      text: randomAnswer([
        "Acne Control Facial is a skincare treatment focused on helping care for acne-prone skin.",
        "This facial is ideal for guests who want targeted care for oily or blemish-prone skin.",
        "Acne Control Facial supports cleaner and healthier-looking skin through focused facial treatment.",
        "If you are looking for a facial for acne-prone skin, Acne Control Facial is one of our available services.",
      ]),
    };
  }

  if (msg.includes("anti-aging facial") || msg.includes("anti aging facial")) {
    return {
      text: randomAnswer([
        "Anti-Aging Facial is designed to help the skin feel refreshed and support a more youthful-looking appearance.",
        "This treatment focuses on facial care that promotes a smoother and revitalized look.",
        "Anti-Aging Facial is a great option for guests who want refreshing skincare with a rejuvenating feel.",
        "If you want a facial focused on skin renewal and a refreshed appearance, Anti-Aging Facial is a good choice.",
      ]),
    };
  }

  if (msg.includes("body scrub")) {
    return {
      text: randomAnswer([
        "Body Scrub is a skin treatment that helps exfoliate the body and leave the skin feeling smoother.",
        "This service removes surface dullness and helps refresh the skin for a softer feel.",
        "Body Scrub is ideal for guests who want a rejuvenating treatment that improves skin texture.",
        "If you want a refreshing exfoliation treatment, Body Scrub is one of our body care options.",
      ]),
    };
  }

  if (msg.includes("detox body wrap")) {
    return {
      text: randomAnswer([
        "Detox Body Wrap is a relaxing body treatment designed to leave you feeling refreshed and pampered.",
        "This service provides a soothing body wrap experience focused on comfort and body care.",
        "Detox Body Wrap is chosen by guests who want a calm and refreshing body wellness treatment.",
        "If you want a body treatment that feels soothing and restorative, Detox Body Wrap is a good option.",
      ]),
    };
  }

  if (msg.includes("slimming therapy")) {
    return {
      text: randomAnswer([
        "Slimming Therapy is one of our body wellness treatments designed for clients exploring body care options.",
        "This service is intended for guests who are interested in body-focused wellness treatments.",
        "Slimming Therapy is offered as part of our body care and spa service lineup.",
        "If you are looking into body wellness treatments, Slimming Therapy is one of the available services.",
      ]),
    };
  }

  if (msg.includes("manicure")) {
    return {
      text: randomAnswer([
        "Manicure is a hand and nail care treatment that helps keep the nails neat and well-groomed.",
        "Our Manicure service focuses on hand care and improving the appearance of the nails.",
        "This treatment is ideal for guests who want tidy, clean, and polished-looking nails.",
        "If you want a simple grooming service for your hands and nails, Manicure is a great choice.",
      ]),
    };
  }

  if (msg.includes("pedicure")) {
    return {
      text: randomAnswer([
        "Pedicure is a foot and nail care treatment that helps keep the feet clean, neat, and refreshed.",
        "Our Pedicure service focuses on toenail grooming and overall foot care.",
        "This treatment is ideal for guests who want well-maintained feet and toenails.",
        "If you want a relaxing grooming treatment for your feet, Pedicure is a good option.",
      ]),
    };
  }

  if (msg.includes("gel polish")) {
    return {
      text: randomAnswer([
        "Gel Polish is a nail treatment that gives the nails a smooth and polished finish.",
        "This service is ideal for guests who want a neat and refined nail appearance.",
        "Gel Polish helps enhance the look of the nails with a clean and attractive finish.",
        "If you want your nails to look polished and stylish, Gel Polish is a great option.",
      ]),
    };
  }

  if (msg.includes("foot spa")) {
    return {
      text: randomAnswer([
        "Foot Spa is a relaxing treatment designed to soothe and refresh tired feet.",
        "This service provides focused foot care to help your feet feel calm and comfortable.",
        "Foot Spa is a great choice for guests who want to unwind and enjoy a soothing foot treatment.",
        "If your feet feel tired and you want a calming service, Foot Spa is one of our relaxing options.",
      ]),
    };
  }

  if (msg.includes("foot reflexology")) {
    return {
      text: randomAnswer([
        "Foot Reflexology is a relaxing foot treatment that applies focused pressure to different areas of the feet.",
        "This service is ideal for guests who enjoy pressure-based foot relaxation treatments.",
        "Foot Reflexology provides a soothing experience designed to help the feet feel relaxed and cared for.",
        "If you want a focused foot treatment with pressure techniques, Foot Reflexology is a good option.",
      ]),
    };
  }

  if (msg.includes("head massage")) {
    return {
      text: randomAnswer([
        "Head Massage is a soothing treatment designed to help ease stress and promote relaxation.",
        "This service focuses on the head area to provide a calming and refreshing experience.",
        "Head Massage is ideal for guests who want a quick but relaxing treatment.",
        "If you want a gentle and calming stress-relief service, Head Massage is a great option.",
      ]),
    };
  }

  if (msg.includes("back scrub")) {
    return {
      text: randomAnswer([
        "Back Scrub is a skin treatment that helps exfoliate and refresh the back area.",
        "This service removes surface dullness and helps the back feel smoother and cleaner.",
        "Back Scrub is ideal for guests who want targeted back skin care and refreshment.",
        "If you want a body care treatment focused on the back, Back Scrub is a good option.",
      ]),
    };
  }

  if (includesAny(msg, ["back pain", "lower back pain", "upper back pain"])) {
    return {
      text: randomAnswer([
        "For back pain, many guests explore Deep Tissue Massage or Hot Stone Massage because these treatments focus on deeper muscle relaxation.",
        "Back discomfort is often addressed through services like Deep Tissue Massage or Swedish Massage.",
        "If you're experiencing back tension, Deep Tissue Massage is commonly chosen to help ease tight muscles.",
        "Hot Stone Massage or Deep Tissue Massage are often explored by guests experiencing back muscle stress.",
      ]),
    };
  }

  if (includesAny(msg, ["neck pain", "stiff neck"])) {
    return {
      text: randomAnswer([
        "For neck tension or stiffness, Swedish Massage or Aromatherapy Massage are commonly explored treatments.",
        "Neck discomfort is often addressed through relaxing services like Swedish Massage.",
        "If you're experiencing neck tension, a relaxing massage such as Swedish Massage may help ease the area.",
        "Many guests experiencing neck stiffness explore Swedish Massage for relaxation.",
      ]),
    };
  }

  if (includesAny(msg, ["shoulder pain", "shoulder tension"])) {
    return {
      text: randomAnswer([
        "For shoulder tension, Deep Tissue Massage or Swedish Massage are commonly chosen treatments.",
        "Shoulder muscle discomfort is often addressed through Deep Tissue Massage.",
        "If your shoulders feel tense, Swedish Massage or Deep Tissue Massage may help relax the muscles.",
        "Many guests experiencing shoulder stiffness explore Deep Tissue Massage for deeper muscle relief.",
      ]),
    };
  }

  if (includesAny(msg, ["headache", "head pain", "migraine"])) {
    return {
      text: randomAnswer([
        "For headaches or head tension, treatments like Head Massage or Aromatherapy Massage may help promote relaxation.",
        "Head Massage is often explored by guests experiencing tension around the head area.",
        "A relaxing Head Massage or Aromatherapy Massage may help when you're experiencing head stress.",
        "Many guests experiencing head tension choose Head Massage for relaxation.",
      ]),
    };
  }

  if (includesAny(msg, ["foot pain", "feet pain", "tired feet", "aching feet"])) {
    return {
      text: randomAnswer([
        "For tired or aching feet, treatments like Foot Spa or Foot Reflexology are commonly explored.",
        "Foot Reflexology focuses on pressure points in the feet and is often chosen for foot discomfort.",
        "Many guests with tired feet explore Foot Spa or Foot Reflexology for relaxation.",
        "Foot Spa or Foot Reflexology are relaxing treatments designed for tired feet.",
      ]),
    };
  }

  if (
    includesAny(msg, [
      "pain",
      "body pain",
      "muscle pain",
      "sore",
      "body ache",
      "body aches",
      "tension",
      "soreness",
    ])
  ) {
    return {
      text: randomAnswer([
        "If you're experiencing general body pain or muscle soreness, treatments like Swedish Massage, Deep Tissue Massage, or Hot Stone Massage may help relax the muscles.",
        "For overall body discomfort or tension, many guests explore services such as Swedish Massage, Aromatherapy Massage, or Deep Tissue Massage.",
        "General body soreness is often addressed with relaxing treatments like Swedish Massage or Hot Stone Massage.",
        "If your body feels tense or sore, massage services such as Deep Tissue Massage or Swedish Massage may help promote relaxation.",
      ]),
    };
  }

  if (includesAny(msg, ["stress", "fatigue", "burnout", "tired", "exhausted"])) {
    return {
      text: randomAnswer([
        "For stress and fatigue, relaxing treatments like Aromatherapy Massage or Swedish Massage are commonly explored.",
        "Many guests experiencing stress choose Aromatherapy Massage for its calming and relaxing spa experience.",
        "If you're feeling tired or mentally stressed, Swedish Massage or Hot Stone Massage may help promote relaxation.",
        "For relaxation and stress relief, Aromatherapy Massage or Swedish Massage are popular choices.",
      ]),
    };
  }

  if (
    includesAny(msg, [
      "service",
      "services",
      "massage",
      "treatment",
      "treatments",
      "offer",
      "offers",
    ])
  ) {
    return {
      text:
        services.length > 0
          ? randomAnswer([
              `Currently, we offer services such as ${formatServices(services)}.`,
              `Our available spa services include ${formatServices(services)}.`,
              `You can explore services like ${formatServices(services)}.`,
              `Some of our treatments include ${formatServices(services)}.`,
              `Here are some services currently available: ${formatServices(services)}.`,
            ])
          : randomAnswer([
              "Our services are still being updated in the system.",
              "I can't retrieve the services right now, but they should appear soon.",
              "The service list may still be syncing in the database.",
              "Our available treatments will appear once the system finishes loading.",
            ]),
    };
  }

  if (
    includesAny(msg, [
      "book",
      "appointment",
      "schedule",
      "booking",
      "reserve",
      "reservation",
    ])
  ) {
    return {
      text: randomAnswer([
        "Sure. You can proceed to the booking page to schedule your appointment.",
        "I'd be happy to help with that. Please continue to the booking page.",
        "You can book an appointment through the booking section of the website.",
        "To schedule a visit, please proceed to the booking page below.",
        "Appointments can be arranged through the booking page.",
      ]),
      action: "booking",
    };
  }

  return {
    text: randomAnswer([
      "I'm not completely sure about that yet. Some parts of the system may still be updating.",
      "That information might still be unavailable in the current system.",
      "I may not have the exact details for that yet.",
      "The website may still be updating that information.",
      "I'm still learning about that part of the system.",
    ]),
  };
}

export default function GinhawaChatBubble({ forceOpen = false }: Props) {
  const [open, setOpen] = useState(forceOpen);
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
    setOpen(forceOpen);
  }, [forceOpen]);

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
            position: forceOpen ? "relative" : "fixed",
            left: forceOpen ? undefined : 24,
            bottom: forceOpen ? undefined : 96,
            width: forceOpen ? "100%" : 360,
            maxWidth: forceOpen ? "100%" : 360,
            height: forceOpen ? "100vh" : 500,
            background: "#f7f3ee",
            borderRadius: forceOpen ? 0 : 28,
            boxShadow: forceOpen ? "none" : "0 18px 45px rgba(60, 70, 50, 0.14)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 999,
            border: forceOpen ? "none" : "1px solid rgba(90, 104, 84, 0.14)",
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

      {!forceOpen && (
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