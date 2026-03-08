"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import SiteShell from "@/components/SiteShell";

type BadgeInfo = {
  name?: string | null;
  description?: string | null;
  icon?: string | null;
  code?: string | null;
  reward?: string | null;
};

type Row = {
  id: number;
  earned_at: string;
  is_used: boolean;
  used_at?: string | null;
  badges?: BadgeInfo | BadgeInfo[] | null;
};

export default function RewardsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    loadBadges();
  }, []);

  async function loadBadges() {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;

    if (!uid) {
      setMsg("Please login first.");
      return;
    }

    const { data, error } = await supabase
      .from("user_badges")
      .select(`
        id,
        earned_at,
        is_used,
        used_at,
        badges(name, description, icon, code, reward)
      `)
      .eq("user_id", uid)
      .order("earned_at", { ascending: false });

    if (error) {
      setMsg(error.message);
      return;
    }

    setRows((data ?? []) as Row[]);
  }

  function normalizeBadge(
    badge: BadgeInfo | BadgeInfo[] | null | undefined
  ): Required<BadgeInfo> {
    const b = Array.isArray(badge) ? badge[0] : badge;

    return {
      name: b?.name || "Badge",
      description: b?.description || "No description",
      icon: b?.icon?.trim() || "🏅",
      code: b?.code || "",
      reward: b?.reward || "Special reward",
    };
  }

  async function useCoupon(row: Row, badge: Required<BadgeInfo>) {
    if (!badge.code) {
      setMsg("This reward has no coupon code.");
      return;
    }

    if (row.is_used) {
      setMsg("This coupon was already used.");
      return;
    }

    try {
      await navigator.clipboard.writeText(badge.code);
    } catch {}

    setMsg(`Coupon selected: ${badge.code}`);

    router.push(
      `/book?coupon=${encodeURIComponent(badge.code)}&reward=${encodeURIComponent(
        badge.reward || ""
      )}`
    );
  }

  return (
    <SiteShell>
      <div className="card cardPad">
        <h2>Unlocked Rewards</h2>

        {msg && <div className="notice">{msg}</div>}

        <div style={{ display: "grid", gap: 16 }}>
          {rows.map((r) => {
            const badge = normalizeBadge(r.badges);

            return (
              <button
                key={r.id}
                onClick={() => useCoupon(r, badge)}
                disabled={r.is_used}
                style={{
                  border: "1px solid #dfe5df",
                  borderRadius: 22,
                  padding: 18,
                  background: r.is_used ? "#f5f5f5" : "#fff",
                  textAlign: "left",
                  cursor: r.is_used ? "not-allowed" : "pointer",
                  opacity: r.is_used ? 0.75 : 1,
                }}
                type="button"
              >
                <div style={{ display: "flex", gap: 14 }}>
                  <div style={{ fontSize: 28 }}>{badge.icon}</div>

                  <div>
                    <div style={{ fontWeight: 700 }}>{badge.name}</div>

                    <div style={{ marginTop: 6 }}>{badge.description}</div>

                    <div
                      style={{
                        marginTop: 8,
                        color: "#4c7c59",
                        fontWeight: 700,
                      }}
                    >
                      Coupon: {badge.code || "No code"}
                    </div>

                    <div style={{ marginTop: 4 }}>
                      Reward: {badge.reward}
                    </div>

                    <div style={{ marginTop: 6, fontSize: 13 }}>
                      Earned: {new Date(r.earned_at).toLocaleString()}
                    </div>

                    {r.is_used ? (
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 13,
                          color: "#b42318",
                          fontWeight: 700,
                        }}
                      >
                        Already used
                        {r.used_at
                          ? ` on ${new Date(r.used_at).toLocaleString()}`
                          : ""}
                      </div>
                    ) : (
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 13,
                          color: "#6b8f74",
                        }}
                      >
                        Click to use reward
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </SiteShell>
  );
}