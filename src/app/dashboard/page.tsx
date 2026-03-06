"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function RewardsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [referralUnlocked, setReferralUnlocked] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;

      if (!uid) {
        setMsg("Please login first.");
        return;
      }

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("referral_unlocked")
        .eq("id", uid)
        .maybeSingle();

      if (profileErr) {
        setMsg(profileErr.message);
        return;
      }

      setReferralUnlocked(profile?.referral_unlocked ?? false);

      const { data, error } = await supabase
        .from("user_badges")
        .select("earned_at, badges(name, description)")
        .eq("user_id", uid)
        .order("earned_at", { ascending: false });

      if (error) {
        setMsg(error.message);
        return;
      }

      setRows(data ?? []);
    })();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "30px auto" }}>
      <h2>Badges / Rewards</h2>

      <div
        className="card cardPad"
        style={{
          marginBottom: 20,
          opacity: referralUnlocked ? 1 : 0.7,
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ margin: 0 }}>Referral Reward</h3>
            <p style={{ margin: "8px 0 4px", color: "var(--muted)" }}>
              Refer a friend and receive a free add-on.
            </p>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              Code: {referralUnlocked ? "Unlocked on owner account" : "SPECIAL_REFERRAL_FRIEND"}
            </p>
          </div>

          <div
            style={{
              alignSelf: "center",
              padding: "6px 12px",
              borderRadius: 999,
              fontWeight: 700,
              background: referralUnlocked ? "#d9f3df" : "#ececec",
              color: referralUnlocked ? "#1f7a38" : "#666",
            }}
          >
            {referralUnlocked ? "Unlocked" : "Locked"}
          </div>
        </div>
      </div>

      {msg && <p style={{ color: "crimson" }}>{msg}</p>}

      {!msg && rows.length === 0 && (
        <p>No badges yet. Book 2 appointments to earn rewards.</p>
      )}

      {rows.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">Badge</th>
              <th align="left">Description</th>
              <th align="left">Earned</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ padding: 8, borderTop: "1px solid #eee" }}>
                  <b>{r.badges?.name}</b>
                </td>
                <td style={{ padding: 8, borderTop: "1px solid #eee" }}>
                  {r.badges?.description}
                </td>
                <td style={{ padding: 8, borderTop: "1px solid #eee" }}>
                  {new Date(r.earned_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}