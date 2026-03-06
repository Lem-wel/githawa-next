"use client";

import { useEffect, useMemo, useState } from "react";
import SiteShell from "@/components/SiteShell";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type Service = {
  id: number;
  name: string;
  category: string;
  description: string;
  duration_minutes: number;
  price: number;
  video_url: string | null;
};

function youtubeToEmbed(url: string) {
  try {
    const u = new URL(url);

    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "").trim();
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    return null;
  } catch {
    return null;
  }
}

function normalizeCategory(category: string | null | undefined) {
  return (category ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[\s_-]+/g, "");
}

function isAddonCategory(category: string | null | undefined) {
  return normalizeCategory(category).includes("addon");
}

export default function ServicesPage() {
  const [msg, setMsg] = useState("");
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    (async () => {
      setMsg("");

      const { data, error } = await supabase
        .from("services")
        .select("id,name,category,description,duration_minutes,price,video_url")
        .order("name", { ascending: true });

      if (error) {
        setMsg(error.message);
        return;
      }

      setServices((data ?? []) as Service[]);
    })();
  }, []);

  const grouped = useMemo(() => {
    const mainServices = services.filter((s) => !isAddonCategory(s.category));
    const addonServices = services.filter((s) => isAddonCategory(s.category));

    const map = new Map<string, Service[]>();

    for (const s of mainServices) {
      const key = s.category || "Other Services";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }

    const CATEGORY_ORDER = [
      "Massage Therapies",
      "Body Treatments",
      "Facial Treatments",
      "Hand & Foot Care",
    ];

    const orderedMain = Array.from(map.entries()).sort(([a], [b]) => {
      const aIndex = CATEGORY_ORDER.indexOf(a);
      const bIndex = CATEGORY_ORDER.indexOf(b);

      const safeA = aIndex === -1 ? 999 : aIndex;
      const safeB = bIndex === -1 ? 999 : bIndex;

      if (safeA !== safeB) return safeA - safeB;
      return a.localeCompare(b);
    });

    if (addonServices.length > 0) {
      orderedMain.push(["Add-ons", addonServices]);
    }

    return orderedMain;
  }, [services]);

  return (
    <SiteShell>
      <div className="card cardPad">
        <h2 style={{ marginTop: 0 }}>Spa Services</h2>
        <p style={{ color: "var(--muted)" }}>Browse services grouped by category.</p>
        {msg && <div className="notice">{msg}</div>}
      </div>

      {grouped.map(([cat, list]) => (
        <div key={cat} className="card cardPad" style={{ marginTop: 14 }}>
          <h3 style={{ marginTop: 0 }}>{cat}</h3>

          <div
            className="servicesGrid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 12,
            }}
          >
            {list.map((s) => {
              const embed = s.video_url ? youtubeToEmbed(s.video_url) : null;

              return (
                <div
                  key={s.id}
                  className="card"
                  style={{ borderRadius: 16, padding: 14, boxShadow: "none" }}
                >
                  <div className="pill">
                    {s.duration_minutes} min • ₱{s.price}
                  </div>

                  <h4 style={{ margin: "10px 0 6px" }}>{s.name}</h4>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>
                    {s.description}
                  </p>

                  {embed && (
                    <div style={{ marginTop: 10 }}>
                      <iframe
                        src={embed}
                        title={`${s.name} video preview`}
                        style={{
                          width: "100%",
                          height: 220,
                          borderRadius: 12,
                          border: 0,
                        }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  )}

                  {s.video_url && !embed && (
                    <div className="notice" style={{ marginTop: 10 }}>
                      Invalid YouTube link for this service.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </SiteShell>
  );
}