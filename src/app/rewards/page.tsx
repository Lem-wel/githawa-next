"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import SiteShell from "@/components/SiteShell";

type BadgeInfo = {
  name?: string;
  description?: string;
  icon?: string | null;
};

type UnlockedBadgeRow = {
  earned_at: string;
  badges?: BadgeInfo | BadgeInfo[] | null;
};

export default function RewardsPage() {
  const [rows, setRows] = useState<UnlockedBadgeRow[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function loadUnlockedBadges() {
      const { data: auth, error: authErr } = await supabase.auth.getUser();

      if (authErr) {
        setMsg(authErr.message);
        return;
      }

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

      console.log("UNLOCKED BADGES RAW:", data);
      setRows((data ?? []) as UnlockedBadgeRow[]);
    }

    loadUnlockedBadges();
  }, []);

  function normalizeBadge(
    badge: BadgeInfo | BadgeInfo[] | null | undefined
  ): Required<BadgeInfo> {
    const b = Array.isArray(badge) ? badge[0] : badge;

    return {
      name: b?.name || "Badge",
      description: b?.description || "No description",
      icon: b?.icon?.trim() || "🏅",
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
            {rows.map((row, i) => {
              const badge = normalizeBadge(row.badges);

              return (
                <div
                  key={i}
                  className="card cardPad"
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 16,
                    borderRadius: 22,
                  }}
                >
                  <div
                    style={{
                      minWidth: 44,
                      width: 44,
                      height: 44,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 28,
                      lineHeight: 1,
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
                      Earned: {new Date(row.earned_at).toLocaleString()}
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