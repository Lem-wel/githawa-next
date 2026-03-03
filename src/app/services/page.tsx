"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Service = {
  id: number;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  category: string;
  video_url: string;
};

export default function ServicesPage() {
  const [grouped, setGrouped] = useState<Record<string, Service[]>>({});

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("category", { ascending: true });

    if (error) {
      console.error(error.message);
      return;
    }

    // Group by category
    const groupedData: Record<string, Service[]> = {};

    data?.forEach((service: Service) => {
      if (!groupedData[service.category]) {
        groupedData[service.category] = [];
      }
      groupedData[service.category].push(service);
    });

    setGrouped(groupedData);
  }

  return (
    <main style={{ maxWidth: 1000, margin: "40px auto", fontFamily: "Arial" }}>
      <h2>Our Services</h2>

      {Object.keys(grouped).map((category) => (
        <div key={category} style={{ marginBottom: 40 }}>
          <h3 style={{ marginBottom: 16 }}>
            {getCategoryIcon(category)} {category.toUpperCase()}
          </h3>

          <div style={{ display: "grid", gap: 20 }}>
            {grouped[category].map((s) => (
              <div
                key={s.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 12,
                  padding: 16,
                  background: "#fff",
                }}
              >
                <h4>{s.name}</h4>
                <p style={{ color: "#555" }}>{s.description}</p>
                <p>
                  ⏱ {s.duration_minutes} mins &nbsp; | &nbsp; 💰 ₱{s.price}
                </p>

                {s.video_url && (
                  <div style={{ marginTop: 10 }}>
                    <iframe
                      width="100%"
                      height="250"
                      src={s.video_url}
                      title={s.name}
                      allowFullScreen
                    ></iframe>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}

// Optional: Add icons per category
function getCategoryIcon(category: string) {
  if (category.includes("Massage")) return "💆‍♀️";
  if (category.includes("Facial")) return "🧖‍♀️";
  if (category.includes("Body")) return "🌸";
  if (category.includes("Hand")) return "💅";
  if (category.includes("Add")) return "🛁";
  return "✨";
}