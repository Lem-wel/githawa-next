"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import SiteShell from "@/components/SiteShell";

type Answers = {
  goal: string;
  pressure: string;
  area: string;
  duration: string;
};

type ServiceOption = {
  name: string;
  category: "massage" | "facial" | "body";
  goals: string[];
  pressures: string[];
  areas: string[];
  durations: string[];
  description: string;
};

type AddonOption = {
  name: string;
  goals: string[];
  areas: string[];
  description: string;
};

type PackageReco = {
  title: string;
  description: string;
  serviceName: string;
  addonNames: string[];
  why: string[];
  score: number;
};

const SERVICE_OPTIONS: ServiceOption[] = [
  {
    name: "Aromatherapy Massage",
    category: "massage",
    goals: ["relaxation", "body_refresh"],
    pressures: ["gentle", "medium"],
    areas: ["full_body", "head", "back"],
    durations: ["60", "90"],
    description: "A calming massage ideal for stress relief and overall relaxation.",
  },
  {
    name: "Swedish Massage",
    category: "massage",
    goals: ["relaxation", "body_refresh"],
    pressures: ["gentle", "medium"],
    areas: ["full_body", "back"],
    durations: ["60", "90"],
    description: "A balanced full-body massage for first-time guests and general relaxation.",
  },
  {
    name: "Hot Stone Massage",
    category: "massage",
    goals: ["relaxation", "pain_relief"],
    pressures: ["medium", "strong"],
    areas: ["full_body", "back"],
    durations: ["90"],
    description: "A deeper warming treatment that helps reduce tension and muscle tightness.",
  },
  {
    name: "Deep Tissue Massage",
    category: "massage",
    goals: ["pain_relief"],
    pressures: ["medium", "strong"],
    areas: ["back", "full_body"],
    durations: ["60"],
    description: "Focused pressure for muscle tension, stiffness, and deeper body aches.",
  },
  {
    name: "Deep Tissue Massage Extra",
    category: "massage",
    goals: ["pain_relief"],
    pressures: ["strong"],
    areas: ["back", "full_body"],
    durations: ["90"],
    description: "An extended deep-pressure session for more serious muscle tension.",
  },
  {
    name: "Foot Reflexology",
    category: "massage",
    goals: ["pain_relief", "relaxation"],
    pressures: ["gentle", "medium", "strong"],
    areas: ["feet"],
    durations: ["60"],
    description: "Pressure-point therapy focused on the feet to ease fatigue and tension.",
  },
  {
    name: "Head Massage",
    category: "massage",
    goals: ["relaxation"],
    pressures: ["gentle", "medium"],
    areas: ["head"],
    durations: ["60"],
    description: "A soothing treatment for scalp tension, stress, and mental relaxation.",
  },
  {
    name: "Brightening Facial",
    category: "facial",
    goals: ["skin_care", "relaxation"],
    pressures: ["gentle", "medium"],
    areas: ["head"],
    durations: ["60"],
    description: "A gentle facial treatment for glow, hydration, and skin refresh.",
  },
  {
    name: "Acne Control Facial",
    category: "facial",
    goals: ["skin_care"],
    pressures: ["medium", "strong"],
    areas: ["head"],
    durations: ["60", "90"],
    description: "A targeted facial treatment designed for deep cleansing and breakout care.",
  },
  {
    name: "Body Scrub",
    category: "body",
    goals: ["body_refresh", "skin_care"],
    pressures: ["gentle", "medium"],
    areas: ["full_body", "back"],
    durations: ["60", "90"],
    description: "An exfoliating treatment that refreshes the skin and improves texture.",
  },
];

const ADDON_OPTIONS: AddonOption[] = [
  {
    name: "Head Massage",
    goals: ["relaxation", "skin_care"],
    areas: ["head"],
    description: "Recommended for scalp tension and added relaxation.",
  },
  {
    name: "Back Scrub",
    goals: ["body_refresh", "skin_care"],
    areas: ["back"],
    description: "Good for exfoliation and skin renewal on the back area.",
  },
  {
    name: "Foot Reflexology",
    goals: ["pain_relief", "relaxation"],
    areas: ["feet"],
    description: "Helpful for tired feet and pressure-point relief.",
  },
];

function buildWhyLines(service: ServiceOption, answers: Answers, addonNames: string[]) {
  const lines: string[] = [];

  if (service.goals.includes(answers.goal)) {
    lines.push("Matches your main wellness goal.");
  }

  if (service.pressures.includes(answers.pressure)) {
    lines.push("Fits your preferred pressure or intensity.");
  }

  if (service.areas.includes(answers.area)) {
    lines.push("Targets your selected focus area.");
  }

  if (service.durations.includes(answers.duration)) {
    lines.push(`Works well for your preferred ${answers.duration}-minute session.`);
  }

  if (addonNames.length > 0) {
    lines.push(`Includes add-on support for your selected area: ${addonNames.join(", ")}.`);
  }

  return lines.slice(0, 4);
}

function getPackageTitle(service: ServiceOption, answers: Answers) {
  if (answers.goal === "relaxation") return "Relax & Reset Package";
  if (answers.goal === "pain_relief") return "Tension Relief Package";
  if (answers.goal === "skin_care") return "Skin Glow Package";
  if (answers.goal === "body_refresh") return "Body Renewal Package";
  return `${service.name} Package`;
}

export default function OnboardingPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [answers, setAnswers] = useState<Answers>({
    goal: "",
    pressure: "",
    area: "",
    duration: "",
  });

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;

      if (!uid) {
        router.push("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role, onboarding_done")
        .eq("id", uid)
        .single();

      if (error || !profile) {
        router.push("/dashboard");
        return;
      }

      if (profile.role !== "customer") {
        router.push("/dashboard");
        return;
      }

      if (profile.onboarding_done) {
        router.push("/dashboard");
      }
    })();
  }, [router]);

  const recommendations = useMemo<PackageReco[]>(() => {
    if (!answers.goal || !answers.pressure || !answers.area || !answers.duration) return [];

    const scored = SERVICE_OPTIONS.map((service) => {
      let score = 0;

      if (service.goals.includes(answers.goal)) score += 5;
      if (service.pressures.includes(answers.pressure)) score += 3;
      if (service.areas.includes(answers.area)) score += 4;
      if (service.durations.includes(answers.duration)) score += 3;

      // Extra realism rules
      if (answers.goal === "skin_care" && service.category === "facial") score += 4;
      if (answers.goal === "pain_relief" && service.name.includes("Deep Tissue")) score += 3;
      if (answers.goal === "relaxation" && service.name.includes("Aromatherapy")) score += 3;
      if (answers.goal === "body_refresh" && service.name === "Body Scrub") score += 4;

      if (answers.area === "head" && service.category === "facial") score += 2;
      if (answers.area === "feet" && service.name === "Foot Reflexology") score += 5;
      if (answers.area === "back" && service.name.includes("Deep Tissue")) score += 2;
      if (answers.duration === "90" && service.durations.includes("90")) score += 1;

      // Mild penalty for weaker fit
      if (!service.goals.includes(answers.goal)) score -= 2;
      if (!service.areas.includes(answers.area)) score -= 1;

      const matchedAddons = ADDON_OPTIONS.filter(
        (addon) =>
          addon.goals.includes(answers.goal) ||
          addon.areas.includes(answers.area)
      )
        .filter((addon) => addon.name !== service.name)
        .slice(0, 2)
        .map((addon) => addon.name);

      return {
        title: getPackageTitle(service, answers),
        description: service.description,
        serviceName: service.name,
        addonNames: matchedAddons,
        why: buildWhyLines(service, answers, matchedAddons),
        score,
      };
    });

    const uniqueTop = scored
      .sort((a, b) => b.score - a.score)
      .filter(
        (pack, index, arr) =>
          index === arr.findIndex((p) => p.serviceName === pack.serviceName)
      )
      .slice(0, 3);

    return uniqueTop;
  }, [answers]);

  const isComplete =
    answers.goal && answers.pressure && answers.area && answers.duration;

  async function choosePackage(pack: PackageReco) {
    setMsg("");
    setLoading(true);

    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;

      if (!uid) {
        router.push("/login");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ onboarding_done: true })
        .eq("id", uid);

      if (error) {
        setMsg(error.message);
        return;
      }

      const params = new URLSearchParams();
      params.set("service", pack.serviceName);

      if (pack.addonNames.length > 0) {
        params.set("addons", pack.addonNames.join(","));
      }

      router.push(`/book?${params.toString()}`);
    } finally {
      setLoading(false);
    }
  }

  async function skipOnboarding() {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;

    if (!uid) {
      router.push("/login");
      return;
    }

    await supabase.from("profiles").update({ onboarding_done: true }).eq("id", uid);

    router.push("/dashboard");
  }

  return (
    <SiteShell>
      <div className="bookingContainer">
        <div className="card cardPad bookingCard">
          <h2 style={{ marginTop: 0 }}>Quick Wellness Check</h2>
          <p style={{ color: "var(--muted)" }}>
            Answer a few questions so we can recommend the best package for your needs.
          </p>

          {msg && (
            <div className="notice" style={{ marginBottom: 12 }}>
              {msg}
            </div>
          )}

          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label>Main goal</label>
              <select
                value={answers.goal}
                onChange={(e) => setAnswers((p) => ({ ...p, goal: e.target.value }))}
              >
                <option value="">Select goal</option>
                <option value="relaxation">Relaxation / Stress Relief</option>
                <option value="pain_relief">Pain Relief / Muscle Tension</option>
                <option value="skin_care">Skin Care / Facial Care</option>
                <option value="body_refresh">Body Refresh / Exfoliation</option>
              </select>
            </div>

            <div>
              <label>Preferred pressure / intensity</label>
              <select
                value={answers.pressure}
                onChange={(e) => setAnswers((p) => ({ ...p, pressure: e.target.value }))}
              >
                <option value="">Select preference</option>
                <option value="gentle">Gentle</option>
                <option value="medium">Medium</option>
                <option value="strong">Strong</option>
              </select>
            </div>

            <div>
              <label>Focus area</label>
              <select
                value={answers.area}
                onChange={(e) => setAnswers((p) => ({ ...p, area: e.target.value }))}
              >
                <option value="">Select area</option>
                <option value="head">Head / Scalp</option>
                <option value="back">Back</option>
                <option value="feet">Feet</option>
                <option value="full_body">Full Body</option>
              </select>
            </div>

            <div>
              <label>Preferred session length</label>
              <select
                value={answers.duration}
                onChange={(e) => setAnswers((p) => ({ ...p, duration: e.target.value }))}
              >
                <option value="">Select duration</option>
                <option value="60">Around 60 minutes</option>
                <option value="90">Around 90 minutes</option>
              </select>
            </div>
          </div>

          {isComplete && (
            <div style={{ marginTop: 22 }}>
              <h3 style={{ marginBottom: 10 }}>Top 3 Recommended Packages</h3>

              <div style={{ display: "grid", gap: 12 }}>
                {recommendations.map((pack, index) => (
                  <button
                    key={`${pack.title}-${pack.serviceName}`}
                    type="button"
                    onClick={() => choosePackage(pack)}
                    disabled={loading}
                    className="card"
                    style={{
                      textAlign: "left",
                      padding: 16,
                      borderRadius: 18,
                      border: index === 0 ? "2px solid #87b796" : "1px solid #dbe3dc",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      className="pill"
                      style={{
                        marginBottom: 10,
                        display: "inline-block",
                      }}
                    >
                      {index === 0 ? "Best Match" : `Option ${index + 1}`}
                    </div>

                    <h4 style={{ margin: "0 0 6px" }}>{pack.title}</h4>

                    <p style={{ margin: "0 0 8px", color: "var(--muted)" }}>
                      {pack.description}
                    </p>

                    <div style={{ fontSize: 14, marginBottom: 4 }}>
                      <b>Main service:</b> {pack.serviceName}
                    </div>

                    <div style={{ fontSize: 14, marginBottom: 8 }}>
                      <b>Add-ons:</b>{" "}
                      {pack.addonNames.length > 0 ? pack.addonNames.join(", ") : "None"}
                    </div>

                    <div style={{ fontSize: 13, color: "var(--muted)" }}>
                      <b>Why this matches you:</b>
                      <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
                        {pack.why.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 14 }}>
                <button className="btn" type="button" onClick={skipOnboarding}>
                  Skip for now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SiteShell>
  );
}