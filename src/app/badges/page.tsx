"use client";

import { useEffect, useMemo, useState } from "react";
import SiteShell from "@/components/SiteShell";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BadgesPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [count, setCount] = useState(0);

  useEffect(() => {
    (async () => {
      setMsg("");
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return router.push("/login");

      const { count, error } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", auth.user.id);

      if (error) setMsg(error.message);
      setCount(count ?? 0);
    })();
  }, [router]);

  const badges = useMemo(() => {
    return [
      { id: "b1", title: "First Step", desc: "Book your first appointment.", earned: count >= 1 },
      { id: "b2", title: "Consistency", desc: "Book 2 appointments.", earned: count >= 2 },
      { id: "b3", title: "Wellness Regular", desc: "Book 5 appointments.", earned: count >= 5 },
    ];
  }, [count]);

  return (
    <SiteShell right={<Link className="btn" href="/dashboard">Dashboard</Link>}>
      <div className="card cardPad">
        <h2 style={{ marginTop: 0 }}>Badges</h2>
        <p style={{ color: "var(--muted)" }}>Earn badges by booking appointments. Total bookings: <b>{count}</b></p>
        {msg && <div className="notice">{msg}</div>}
      </div>

      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
        {badges.map((b) => (
          <div key={b.id} className="card cardPad" style={{ boxShadow: "none" }}>
            <div className="pill">{b.earned ? "Unlocked ✅" : "Locked 🔒"}</div>
            <h3 style={{ margin: "10px 0 6px" }}>{b.title}</h3>
            <p style={{ margin: 0, color: "var(--muted)" }}>{b.desc}</p>
          </div>
        ))}
      </div>
    </SiteShell>
  );
}