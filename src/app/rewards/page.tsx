"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ReferralRewardCard() {
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(true);
  const [userReferralCode, setUserReferralCode] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setMsg("");

      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) {
        setMsg(authError.message);
        setLoading(false);
        return;
      }

      const uid = authData.user?.id;
      if (!uid) {
        setMsg("Please login first.");
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("referral_code, referral_unlocked")
        .eq("id", uid)
        .maybeSingle();

      if (profileError) {
        setMsg(profileError.message);
        setLoading(false);
        return;
      }

      setUserReferralCode(profile?.referral_code || "");
      setLocked(!(profile?.referral_unlocked ?? false));
      setLoading(false);
    }

    loadProfile();
  }, []);

  return (
    <div className="card cardPad" style={{ position: "relative", opacity: locked ? 0.7 : 1 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 28 }}>🤝</div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0 }}>Referral Reward</h3>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                fontSize: 12,
                border: "1px solid var(--border)",
                background: locked ? "#f5f5f5" : "#ecfdf3",
                color: locked ? "#666" : "#15803d",
                fontWeight: 600,
              }}
            >
              {loading ? "Loading..." : locked ? "Locked" : "Unlocked"}
            </span>
          </div>

          <p style={{ margin: "8px 0 4px", color: "var(--muted)" }}>
            Refer a friend and receive a free add-on.
          </p>

          <p style={{ margin: 0, color: "var(--muted)" }}>
            Code:{" "}
            <span style={{ fontWeight: 700, color: "var(--text)" }}>
              {userReferralCode || "N/A"}
            </span>
          </p>

          {msg && (
            <p style={{ marginTop: 10, color: "crimson" }}>
              {msg}
            </p>
          )}
        </div>

        <div style={{ fontSize: 20 }}>
          {loading ? "⏳" : locked ? "🔒" : "🎁"}
        </div>
      </div>
    </div>
  );
}