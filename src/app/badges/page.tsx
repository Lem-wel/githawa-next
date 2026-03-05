"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import SiteShell from "@/components/SiteShell";
import Link from "next/link";

type Badge = {
  id: number;
  code: string;
  title: string;
  description: string | null;
  icon: string | null;
  required_count: number | null;
};

export default function BadgesPage() {
  const [msg, setMsg] = useState("");
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [unlockedSet, setUnlockedSet] = useState<Set<number>>(new Set());

  useEffect(() => {
    (async () => {
      setMsg("");

      // 1) load ALL badges
      const { data: b, error: bErr } = await supabase
        .from("badges")
        .select("id,code,title,description,icon,required_count")
        .order("id", { ascending: true });

      if (bErr) setMsg(bErr.message);
      setAllBadges((b ?? []) as Badge[]);

      // 2) if logged in, load unlocked badges
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;

      const { data: ub, error: ubErr } = await supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", auth.user.id);

      if (ubErr) setMsg((m) => (m ? m + " | " : "") + ubErr.message);

      const set = new Set<number>((ub ?? []).map((x: any) => x.badge_id));
      setUnlockedSet(set);
    })();
  }, []);

  const unlockedCount = useMemo(() => {
    let c = 0;
    for (const b of allBadges) if (unlockedSet.has(b.id)) c++;
    return c;
  }, [allBadges, unlockedSet]);

  return (
    <SiteShell>
      <div className="card cardPad">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0 }}>Badges</h2>
            <p style={{ color: "var(--muted)", marginTop: 6 }}>
              Unlocked {unlockedCount} / {allBadges.length}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link className="btn" href="/dashboard">Dashboard</Link>
          </div>
        </div>

        {msg && <div className="notice" style={{ marginTop: 12 }}>{msg}</div>}
      </div>

      <div className="card cardPad" style={{ marginTop: 14 }}>
        {allBadges.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No badges found.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {allBadges.map((b) => {
              const unlocked = unlockedSet.has(b.id);

              return (
                <div
                  key={b.id}
                  className="card cardPad"
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    opacity: unlocked ? 1 : 0.55,
                  }}
                >
                  <div style={{ fontSize: 28 }}>{b.icon ?? "🏅"}</div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <b>{b.title}</b>
                      <span className={unlocked ? "tagOk" : "tag"}>
                        {unlocked ? "Unlocked" : "Locked"}
                      </span>
                    </div>

                    <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>
                      {b.description ?? "—"}
                    </div>

                    {b.required_count != null && (
                      <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 6 }}>
                        Requirement: {b.required_count} bookings
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: 18 }}>
                    {unlocked ? "✅" : "🔒"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SiteShell>
  );
}