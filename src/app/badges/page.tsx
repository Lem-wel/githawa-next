"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import SiteShell from "@/components/SiteShell";

type BadgeRow = {
  id: number;
  code: string | null;
  name: string;
  description: string | null;
  icon: string | null;
};

export default function BadgesPage() {
  const [msg, setMsg] = useState("");
  const [allBadges, setAllBadges] = useState<BadgeRow[]>([]);
  const [unlockedSet, setUnlockedSet] = useState<Set<number>>(new Set());

  useEffect(() => {
    (async () => {
      setMsg("");

      // Load all badges
      const { data: badgesData, error: bErr } = await supabase
        .from("badges")
        .select("id,code,name,description,icon")
        .order("id", { ascending: true });

      if (bErr) {
        setMsg(bErr.message);
        return;
      }

      const badges = (badgesData ?? []) as BadgeRow[];
      setAllBadges(badges);

      // Check logged user
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;

      const uid = auth.user.id;

      // Get number of bookings
      const { count } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", uid);

      const totalBookings = count ?? 0;

      // Decide which badge codes should unlock
      const unlockCodes: string[] = [];

/* APPOINTMENT BADGES */

if (totalBookings >= 1)
  unlockCodes.push("LEVEL_BRONZE_FIRST_VISIT"); // First Appointment

if (totalBookings >= 2) {
  unlockCodes.push("BOOKED_2_TOTAL"); // 2 Appointments Total
  unlockCodes.push("BOOKED_2_IN_A_ROW"); // 2 Consecutive Appointments
}

if (totalBookings >= 3)
  unlockCodes.push("LEVEL_SILVER_3_VISITS"); // 3 Appointments

if (totalBookings >= 5)
  unlockCodes.push("LEVEL_GOLD_5_VISITS"); // 5 Appointments

if (totalBookings >= 10)
  unlockCodes.push("LEVEL_PLATINUM_10_VISITS"); // 10 Appointments

if (totalBookings >= 15)
  unlockCodes.push("LEVEL_ELITE_15_VISITS"); // 15 Appointments


/* SPECIAL BADGES */

/* Feedback Reward */
const { count: feedbackCount } = await supabase
  .from("feedback")
  .select("*", { count: "exact", head: true })
  .eq("user_id", uid);

if ((feedbackCount ?? 0) >= 1)
  unlockCodes.push("SPECIAL_FEEDBACK_REVIEW");


/* Referral Reward */
const { data: profile } = await supabase
  .from("profiles")
  .select("referral_unlocked")
  .eq("id", uid)
  .maybeSingle();

if (profile?.referral_unlocked)
  unlockCodes.push("SPECIAL_REFERRAL_FRIEND");


/* Birthday Reward */
const today = new Date();
const month = today.getMonth() + 1;

const { data: userProfile } = await supabase
  .from("profiles")
  .select("birthdate")
  .eq("id", uid)
  .maybeSingle();

if (userProfile?.birthdate) {
  const birthMonth = new Date(userProfile.birthdate).getMonth() + 1;

  if (birthMonth === month)
    unlockCodes.push("SPECIAL_BIRTHMONTH");
}

      // Convert codes to badge ids
      const badgeIdsToUnlock = badges
        .filter((b) => b.code && unlockCodes.includes(b.code))
        .map((b) => b.id);

      // Insert missing badges
      for (const bid of badgeIdsToUnlock) {
        await supabase.from("user_badges").upsert({
          user_id: uid,
          badge_id: bid,
        });
      }

      // Reload unlocked badges
      const { data: ub, error: ubErr } = await supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", uid);

      if (ubErr) {
        setMsg(ubErr.message);
        return;
      }

      const set = new Set<number>((ub ?? []).map((x: any) => Number(x.badge_id)));
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
        <h2 style={{ margin: 0 }}>Badges</h2>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>
          Unlocked {unlockedCount} / {allBadges.length}
        </p>

        {msg && (
          <div className="notice" style={{ marginTop: 12 }}>
            {msg}
          </div>
        )}
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
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <b>{b.name}</b>

                      <span className={unlocked ? "tagOk" : "tag"}>
                        {unlocked ? "Unlocked" : "Locked"}
                      </span>
                    </div>

                    <div
                      style={{
                        color: "var(--muted)",
                        fontSize: 13,
                        marginTop: 2,
                      }}
                    >
                      {b.description ?? "—"}
                    </div>

                    {b.code && (
                      <div
                        style={{
                          color: "var(--muted)",
                          fontSize: 12,
                          marginTop: 6,
                        }}
                      >
                        Code: {b.code}
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: 18 }}>{unlocked ? "✅" : "🔒"}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SiteShell>
  );
}