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

type PackageReco = {
  title: string;
  description: string;
  serviceName: string;
  addonNames: string[];
};

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
    const packs: PackageReco[] = [];

    if (answers.goal === "relaxation") {
      packs.push({
        title: "Relaxation Package",
        description: "Best for stress relief and relaxation.",
        serviceName: answers.duration === "90" ? "Hot Stone Massage" : "Aromatherapy Massage",
        addonNames: answers.area === "head" ? ["Head Massage"] : [],
      });
    }

    if (answers.goal === "pain_relief") {
      packs.push({
        title: "Relief Package",
        description: "Best for muscle tension and body aches.",
        serviceName: answers.duration === "90" ? "Deep Tissue Massage Extra" : "Deep Tissue Massage",
        addonNames: answers.area === "feet" ? ["Foot Reflexology"] : [],
      });
    }

    if (answers.goal === "skin_care") {
      packs.push({
        title: "Glow Package",
        description: "Best for facial care and skin refresh.",
        serviceName:
          answers.pressure === "gentle" ? "Brightening Facial" : "Acne Control Facial",
        addonNames: [],
      });
    }

    if (answers.goal === "body_refresh") {
      packs.push({
        title: "Body Renewal Package",
        description: "Best for exfoliation and body rejuvenation.",
        serviceName: "Body Scrub",
        addonNames: answers.area === "back" ? ["Back Scrub"] : [],
      });
    }

    if (packs.length === 0) {
      packs.push({
        title: "Wellness Starter Package",
        description: "A balanced option for first-time guests.",
        serviceName: "Swedish Massage",
        addonNames: [],
      });
    }

    return packs.slice(0, 3);
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

    await supabase
      .from("profiles")
      .update({ onboarding_done: true })
      .eq("id", uid);

    router.push("/dashboard");
  }

  return (
    <SiteShell>
      <div className="bookingContainer">
        <div className="card cardPad bookingCard">
          <h2 style={{ marginTop: 0 }}>Quick Wellness Check</h2>
          <p style={{ color: "var(--muted)" }}>
            Answer a few questions so we can recommend a package for you.
          </p>

          {msg && <div className="notice" style={{ marginBottom: 12 }}>{msg}</div>}

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
              <h3 style={{ marginBottom: 10 }}>Recommended Packages</h3>

              <div style={{ display: "grid", gap: 12 }}>
                {recommendations.map((pack) => (
                  <button
                    key={pack.title}
                    type="button"
                    onClick={() => choosePackage(pack)}
                    disabled={loading}
                    className="card"
                    style={{
                      textAlign: "left",
                      padding: 16,
                      borderRadius: 18,
                      border: "1px solid #dbe3dc",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <div className="pill" style={{ marginBottom: 10 }}>
                      Recommended Package
                    </div>
                    <h4 style={{ margin: "0 0 6px" }}>{pack.title}</h4>
                    <p style={{ margin: "0 0 8px", color: "var(--muted)" }}>
                      {pack.description}
                    </p>
                    <div style={{ fontSize: 14 }}>
                      <b>Main service:</b> {pack.serviceName}
                    </div>
                    <div style={{ fontSize: 14, marginTop: 4 }}>
                      <b>Add-ons:</b>{" "}
                      {pack.addonNames.length > 0 ? pack.addonNames.join(", ") : "None"}
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