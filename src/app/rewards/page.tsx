"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import SiteShell from "@/components/SiteShell";

type UnlockedBadgeRow = {
  earned_at: string;
  badges:
    | {
        name?: string;
        description?: string;
        icon?: string | null;
      }
    | {
        name?: string;
        description?: string;
        icon?: string | null;
      }[]
    | null;
};

export default function RewardsPage() {
  const [rows, setRows] = useState<UnlockedBadgeRow[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function loadUnlockedBadges() {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;

      if (!uid) {
        setMsg("Please login first.");
        return;
      }

      const { data, error } = await supabase
        .from("user_badges")
        .select("earned_at, badges(name, description, icon)")
        .eq("user_id", uid)
        .order("earned_at", { ascending: false });

      if (error) {
        setMsg(error.message);
        return;
      }

      setRows((data ?? []) as UnlockedBadgeRow[]);
    }

    loadUnlockedBadges();
  }, []);

  function getBadgeInfo(
    badge: UnlockedBadgeRow["badges"]
  ): { name: string; description: string; icon: string } {
    const b = Array.isArray(badge) ? badge[0] : badge;

    return {
      name: b?.name || "Badge",
      description: b?.description || "No description",
      icon: b?.icon && b.icon.trim() ? b.icon : "🏅",
    };
  }

  return (
    <SiteShell>
      <div className="card cardPad">
        <h2 style={{ marginTop: 0 }}>Unlocked Badges</h2>

        {msg && (
          <div className="notice" style={{ marginTop: 12 }}>
            {msg}
          </div>
        )}

        {!msg && rows.length === 0 && (
          <p style={{ color: "var(--muted)" }}>No badges unlocked yet.</p>
        )}

        {rows.length > 0 && (
          <div style={{ display: "grid", gap: 16 }}>
            {rows.map((r, i) => {
              const badge = getBadgeInfo(r.badges);

              return (
                <div
                  key={i}
                  className="card cardPad"
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                    borderRadius: 22,
                  }}
                >
                  <div
                    style={{
                      fontSize: 30,
                      lineHeight: 1,
                      minWidth: 40,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      paddingTop: 2,
                    }}
                  >
                    {badge.icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>
                      {badge.name}
                    </div>

                    <div style={{ color: "var(--muted)", marginTop: 6 }}>
                      {badge.description}
                    </div>

                    <div style={{ color: "var(--muted)", marginTop: 8 }}>
                      Earned: {new Date(r.earned_at).toLocaleString()}
                    </div>
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