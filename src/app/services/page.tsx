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

export default function ServicesPage() {
  const [msg, setMsg] = useState("");
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    (async () => {
      setMsg("");
      const { data, error } = await supabase
        .from("services")
        .select("id,name,category,description,duration_minutes,price,video_url")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) setMsg(error.message);
      setServices((data ?? []) as Service[]);
    })();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const s of services) {
      const key = s.category || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries());
  }, [services]);

  return (
    <SiteShell right={<Link className="btn btnPrimary" href="/book">Book</Link>}>
      <div className="card cardPad">
        <h2 style={{ marginTop: 0 }}>Spa Services</h2>
        <p style={{ color: "var(--muted)" }}>Browse services grouped by category.</p>
        {msg && <div className="notice">{msg}</div>}
      </div>

      {grouped.map(([cat, list]) => (
        <div key={cat} className="card cardPad" style={{ marginTop: 14 }}>
          <h3 style={{ marginTop: 0 }}>{cat}</h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            {list.map((s) => (
              <div key={s.id} className="card" style={{ borderRadius: 16, padding: 14, boxShadow: "none" }}>
                <div className="pill">{s.duration_minutes} min • ₱{s.price}</div>
                <h4 style={{ margin: "10px 0 6px" }}>{s.name}</h4>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>{s.description}</p>

                {s.video_url && (
                  <div style={{ marginTop: 10 }}>
                    <video controls style={{ width: "100%", borderRadius: 12 }}>
                      <source src={s.video_url} />
                    </video>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </SiteShell>
  );
}