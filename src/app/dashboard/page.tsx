"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import { supabase } from "@/lib/supabaseClient";

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
      .eq("user_id", user.id)
      .order("appt_date", { ascending: false });

    if (bookingErr) {
      console.error("BOOKING ERROR:", bookingErr);
    } else {
      const safeBookings = (bookingData ?? []) as BookingRow[];
      setBookings(safeBookings);
      setBookingCount(safeBookings.length);
    }

    const { data: badgeData, error: badgeErr } = await supabase
      .from("user_badges")
      .select("earned_at, badges(name, description)")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false });

    if (badgeErr) {
      console.error("BADGE ERROR:", badgeErr);
    } else {
      const safeBadges = (badgeData ?? []) as BadgeRow[];
      setBadges(safeBadges);
      setBadgeCount(safeBadges.length + (profile?.referral_unlocked ? 1 : 0));
    }
  }

  return (
    <SiteShell>
      <div style={{ maxWidth: 1150, margin: "24px auto" }}>
        {msg && (
          <div className="notice" style={{ marginBottom: 14 }}>
            {msg}
          </div>
        )}

        <div
          className="card cardPad"
          style={{
            borderRadius: 34,
            padding: 28,
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <h2 style={{ margin: 0, fontSize: 24 }}>{fullName}</h2>
            <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 15 }}>
              {email}
            </p>
            <p
              style={{
                margin: "4px 0 0",
                color: "#8aad91",
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              Status: Active
            </p>

            <div
              style={{
                marginTop: 14,
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 999,
                background: "#eef4ef",
                border: "1px solid #dfe5df",
                fontSize: 14,
              }}
            >
              <span style={{ color: "var(--muted)" }}>Your Referral Code:</span>
              <span style={{ fontWeight: 700, color: "var(--text)" }}>
                {referralCode || "N/A"}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              marginBottom: 22,
            }}
          >
            <button
              className="btn"
              onClick={() =>setActiveTab((prev) => (prev === "bookings" ? null : "bookings"))}
              style={{
                borderRadius: 999,
                padding: "14px 26px",
                minWidth: 128,
                fontWeight: 700,
                fontSize: 15,
                border:
                  activeTab === "bookings"
                    ? "2px solid #2d2d2d"
                    : "1px solid #d5ddd6",
                background: "#e8efe9",
                boxShadow: "none",
              }}
            >
              Bookings {bookingCount}
            </button>

            <button
              className="btn"
              onClick={() =>
  setActiveTab((prev) => (prev === "badges" ? null : "badges"))
}
              style={{
                borderRadius: 999,
                padding: "14px 26px",
                minWidth: 128,
                fontWeight: 700,
                fontSize: 15,
                border:
                  activeTab === "badges"
                    ? "2px solid #2d2d2d"
                    : "1px solid #d5ddd6",
                background: "#e8efe9",
                boxShadow: "none",
              }}
            >
              Badges {badgeCount}
            </button>
          </div>

          {activeTab && (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e7ebe7",
                borderRadius: 34,
                padding: 30,
                minHeight: 260,
              }}
            >
              {activeTab === "bookings" && (
                <>
                  <h2
                    style={{
                      marginTop: 0,
                      marginBottom: 20,
                      fontSize: 30,
                    }}
                  >
                    Your Bookings
                  </h2>

                  {bookings.length === 0 ? (
                    <p style={{ color: "var(--muted)", fontSize: 16 }}>
                      No bookings yet.
                    </p>
                  ) : (
                    <div style={{ display: "grid", gap: 16 }}>
                      {bookings.map((b) => (
                        <div
                          key={b.id}
                          style={{
                            border: "1px solid #dfe5df",
                            borderRadius: 22,
                            padding: "18px 20px",
                            background: "#fff",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 18,
                              fontWeight: 700,
                              marginBottom: 8,
                            }}
                          >
                            {b.services?.name || "Service"}
                          </div>

                          <div style={{ color: "var(--muted)", fontSize: 15 }}>
                            {b.appt_date} at {b.appt_time}
                          </div>

                          <div
                            style={{
                              color: "var(--muted)",
                              fontSize: 15,
                              marginTop: 6,
                            }}
                          >
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
                  <h2
                    style={{
                      marginTop: 0,
                      marginBottom: 20,
                      fontSize: 30,
                    }}
                  >
                    Unlocked Badges
                  </h2>

                  <div
                    style={{
                      marginBottom: 16,
                      padding: 18,
                      borderRadius: 22,
                      border: "1px solid #dfe5df",
                      background: referralUnlocked ? "#eef6ef" : "#f6f6f6",
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
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ fontSize: 28, lineHeight: 1 }}>🎁</div>

                        <div>
                          <div style={{ fontSize: 18, fontWeight: 700 }}>
                            Referral Reward
                          </div>
                          <div style={{ color: "var(--muted)", marginTop: 6 }}>
                            Refer a friend and receive a free add-on.
                          </div>
                          <div style={{ marginTop: 8, color: "var(--muted)" }}>
                            Reward Type: Free add-on
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          padding: "8px 14px",
                          borderRadius: 999,
                          fontSize: 14,
                          fontWeight: 700,
                          background: referralUnlocked ? "#d8f0dc" : "#ececec",
                          color: referralUnlocked ? "#1d7c38" : "#666",
                        }}
                      >
                        {referralUnlocked ? "Unlocked" : "Locked"}
                      </div>
                    </div>
                  </div>

                  {badges.length === 0 ? (
                    <p style={{ color: "var(--muted)", fontSize: 16 }}>
                      No other badges unlocked yet.
                    </p>
                  ) : (
                    <div style={{ display: "grid", gap: 14 }}>
                      {badges.map((b, i) => (
                        <div
                          key={i}
                          style={{
                            border: "1px solid #dfe5df",
                            borderRadius: 22,
                            padding: "18px 20px",
                            background: "#fff",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                            <div style={{ fontSize: 26, lineHeight: 1 }}>🏅</div>

                            <div>
                              <div style={{ fontWeight: 700, fontSize: 17 }}>
                                {b.badges?.name || "Badge"}
                              </div>
                              <div style={{ color: "var(--muted)", marginTop: 6 }}>
                                {b.badges?.description || "No description"}
                              </div>
                              <div style={{ color: "var(--muted)", marginTop: 6 }}>
                                Earned: {new Date(b.earned_at).toLocaleString()}
                              </div>
                            </div>
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
              gap: 14,
              flexWrap: "wrap",
              marginTop: 24,
            }}
          >
            <Link
              href="/book"
              className="btn btnPrimary"
              style={{
                borderRadius: 999,
                padding: "14px 28px",
              }}
            >
              Book Appointment
            </Link>

            <Link
              href="/services"
              className="btn"
              style={{
                borderRadius: 999,
                padding: "14px 28px",
              }}
            >
              Spa Services
            </Link>

            <Link
              href="/activities"
              className="btn"
              style={{
                borderRadius: 999,
                padding: "14px 28px",
              }}
            >
              Wellness Activities
            </Link>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}