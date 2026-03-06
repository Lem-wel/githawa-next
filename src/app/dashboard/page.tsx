"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";

type BookingRow = {
  id: number;
  appt_date: string;
  appt_time: string;
  duration_minutes: number | null;
  services?: { name?: string } | null;
  rooms?: { name?: string } | null;
  staff?: { name?: string } | null;
};

type BadgeRow = {
  earned_at: string;
  badges?: {
    name?: string;
    description?: string;
  } | null;
};

export default function DashboardPage() {
  const [msg, setMsg] = useState("");
  const [fullName, setFullName] = useState("Customer");
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referralUnlocked, setReferralUnlocked] = useState(false);

  const [bookingCount, setBookingCount] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);

  const [activeTab, setActiveTab] = useState<"bookings" | "badges" | null>(null);

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [badges, setBadges] = useState<BadgeRow[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setMsg("");

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      setMsg("Please login first.");
      return;
    }

    setEmail(user.email || "");

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("full_name, referral_code, referral_unlocked")
      .eq("id", user.id)
      .maybeSingle();

    if (profileErr) {
      setMsg(profileErr.message);
      return;
    }

    setFullName(profile?.full_name || "Customer");
    setReferralCode(profile?.referral_code || "");
    setReferralUnlocked(profile?.referral_unlocked ?? false);

    const { data: bookingData, error: bookingErr } = await supabase
      .from("appointments")
      .select(
        "id, appt_date, appt_time, duration_minutes, services(name), rooms(name), staff(name)"
      )
      .eq("userr_id", user.id)
      .order("appt_date", { ascending: false });

    if (!bookingErr) {
      const safeBookings = (bookingData ?? []) as BookingRow[];
      setBookings(safeBookings);
      setBookingCount(safeBookings.length);
    }

    const { data: badgeData, error: badgeErr } = await supabase
      .from("user_badges")
      .select("earned_at, badges(name, description)")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false });

    if (!badgeErr) {
      const safeBadges = (badgeData ?? []) as BadgeRow[];
      setBadges(safeBadges);

      // +1 if referral reward is unlocked, because it should count in badges area
      setBadgeCount(safeBadges.length + (profile?.referral_unlocked ? 1 : 0));
    }
  }

  return (
    <SiteShell>
      <div style={{ maxWidth: 1100, margin: "20px auto" }}>
        {msg && (
          <div className="notice" style={{ marginBottom: 12 }}>
            {msg}
          </div>
        )}

        <div className="card cardPad">
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{fullName}</div>
            <div style={{ marginTop: 4, color: "#87a98e", fontWeight: 600 }}>
              Status: Active
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            <button
              className="btn"
              onClick={() => setActiveTab("bookings")}
              style={{
                borderRadius: 999,
                padding: "12px 18px",
                border:
                  activeTab === "bookings"
                    ? "2px solid #222"
                    : "1px solid var(--border)",
                background: "#eaf1ec",
                fontWeight: 700,
              }}
            >
              Bookings {bookingCount}
            </button>

            <button
              className="btn"
              onClick={() => setActiveTab("badges")}
              style={{
                borderRadius: 999,
                padding: "12px 18px",
                border:
                  activeTab === "badges"
                    ? "2px solid #222"
                    : "1px solid var(--border)",
                background: "#eaf1ec",
                fontWeight: 700,
              }}
            >
              Badges {badgeCount}
            </button>
          </div>

          {activeTab && (
            <div
              className="card"
              style={{
                padding: 24,
                minHeight: 180,
                borderRadius: 28,
                background: "#fff",
              }}
            >
              {activeTab === "bookings" && (
                <>
                  <h2 style={{ marginTop: 0 }}>Your Bookings</h2>

                  {bookings.length === 0 ? (
                    <p style={{ color: "var(--muted)" }}>No bookings yet.</p>
                  ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                      {bookings.map((b) => (
                        <div
                          key={b.id}
                          style={{
                            padding: 14,
                            border: "1px solid var(--border)",
                            borderRadius: 16,
                          }}
                        >
                          <div style={{ fontWeight: 700 }}>
                            {b.services?.name || "Service"}
                          </div>
                          <div style={{ color: "var(--muted)", marginTop: 4 }}>
                            {b.appt_date} at {b.appt_time}
                          </div>
                          <div style={{ color: "var(--muted)", marginTop: 4 }}>
                            Staff: {b.staff?.name || "Not assigned"} | Room:{" "}
                            {b.rooms?.name || "N/A"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === "badges" && (
                <>
                  <h2 style={{ marginTop: 0 }}>Unlocked Badges</h2>

                  <div
                    style={{
                      marginBottom: 16,
                      padding: 18,
                      borderRadius: 18,
                      border: "1px solid var(--border)",
                      background: referralUnlocked ? "#eef8f0" : "#f6f6f6",
                      opacity: referralUnlocked ? 1 : 0.75,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>
                          Referral Reward
                        </div>
                        <div style={{ color: "var(--muted)", marginTop: 6 }}>
                          Refer a friend and receive a free add-on.
                        </div>
                        <div style={{ marginTop: 10 }}>
                          <span style={{ color: "var(--muted)" }}>Code: </span>
                          <span style={{ fontWeight: 700 }}>
                            {referralUnlocked
                              ? referralCode || "N/A"
                              : "SPECIAL_REFERRAL_FRIEND"}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          padding: "6px 12px",
                          borderRadius: 999,
                          fontSize: 13,
                          fontWeight: 700,
                          background: referralUnlocked ? "#d9f3df" : "#ececec",
                          color: referralUnlocked ? "#1f7a38" : "#666",
                        }}
                      >
                        {referralUnlocked ? "Unlocked" : "Locked"}
                      </div>
                    </div>
                  </div>

                  {badges.length === 0 ? (
                    <p style={{ color: "var(--muted)" }}>
                      No other badges unlocked yet.
                    </p>
                  ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                      {badges.map((b, i) => (
                        <div
                          key={i}
                          style={{
                            padding: 14,
                            border: "1px solid var(--border)",
                            borderRadius: 16,
                          }}
                        >
                          <div style={{ fontWeight: 700 }}>
                            {b.badges?.name || "Badge"}
                          </div>
                          <div style={{ color: "var(--muted)", marginTop: 4 }}>
                            {b.badges?.description || "No description"}
                          </div>
                          <div style={{ color: "var(--muted)", marginTop: 4 }}>
                            Earned: {new Date(b.earned_at).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 24,
            }}
          >
            <Link href="/book" className="btn btnPrimary">
              Book Appointment
            </Link>
            <Link href="/services" className="btn">
              Spa Services
            </Link>
            <Link href="/activities" className="btn">
              Wellness Activities
            </Link>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}