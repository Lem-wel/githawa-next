"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteShell from "@/components/SiteShell";

type BookingRow = {
  id: number;
  appt_date: string;
  appt_time: string;
  duration_minutes: number | null;
  services?: { name?: string } | null;
  rooms?: { name?: string } | null;
  staff?: { name?: string } | null;
  appointment_addons?:
    | {
        addon_service?: { name?: string } | null;
      }[]
    | null;
};

type BadgeInfo = {
  name?: string | null;
  description?: string | null;
  icon?: string | null;
  code?: string | null;
  reward?: string | null;
};

type BadgeRow = {
  earned_at: string;
  badges?: BadgeInfo | BadgeInfo[] | null;
};

export default function DashboardPage() {
  const router = useRouter();

  const [msg, setMsg] = useState("");
  const [fullName, setFullName] = useState("Customer");
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");

  const [bookingCount, setBookingCount] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);

  const [activeTab, setActiveTab] =
    useState<"bookings" | "badges" | "referral" | null>(null);

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [badges, setBadges] = useState<BadgeRow[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setMsg("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMsg("Please login first.");
      return;
    }

    setEmail(user.email || "");

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, referral_code")
      .eq("id", user.id)
      .maybeSingle();

    setFullName(profile?.full_name || "Customer");
    setReferralCode(profile?.referral_code || "");

    const { data: bookingData } = await supabase
      .from("appointments")
      .select(`
        id,
        appt_date,
        appt_time,
        duration_minutes,
        services(name),
        rooms(name),
        staff(name),
        appointment_addons(
          addon_service:services(name)
        )
      `)
      .eq("user_id", user.id)
      .order("appt_date", { ascending: false })
      .order("appt_time", { ascending: false });

    const safeBookings = (bookingData ?? []) as BookingRow[];
    setBookings(safeBookings);
    setBookingCount(safeBookings.length);

    const { data: badgeData } = await supabase
      .from("user_badges")
      .select(`
        earned_at,
        badges(name, description, icon, code, reward)
      `)
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false });

    const safeBadges = (badgeData ?? []) as BadgeRow[];
    setBadges(safeBadges);
    setBadgeCount(safeBadges.length);
  }

  function toggleTab(tab: "bookings" | "badges" | "referral") {
    setActiveTab((prev) => (prev === tab ? null : tab));
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

  async function handleBadgeClick(badge: Required<BadgeInfo>) {
    if (!badge.code) {
      setMsg("This reward has no coupon code.");
      return;
    }

    try {
      await navigator.clipboard.writeText(badge.code);
    } catch {}

    localStorage.setItem("selected_coupon_code", badge.code);
    localStorage.setItem("selected_coupon_reward", badge.reward || "");

    setMsg(`Coupon copied: ${badge.code} ✅`);
    setTimeout(() => setMsg(""), 1500);

    router.push(`/book?coupon=${encodeURIComponent(badge.code)}`);
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

          <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
            <button className="btn" onClick={() => toggleTab("bookings")}>
              Bookings {bookingCount}
            </button>

            <button className="btn" onClick={() => toggleTab("badges")}>
              Badges {badgeCount}
            </button>

            <button className="btn" onClick={() => toggleTab("referral")}>
              Referral
            </button>
          </div>

          {activeTab === "badges" && (
            <>
              <h2>Unlocked Badges</h2>

              <div style={{ display: "grid", gap: 14 }}>
                {badges.map((b, i) => {
                  const badge = normalizeBadge(b.badges);

                  return (
                    <button
                      key={i}
                      onClick={() => handleBadgeClick(badge)}
                      style={{
                        border: "1px solid #dfe5df",
                        borderRadius: 20,
                        padding: 18,
                        background: "#fff",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", gap: 14 }}>
                        <div style={{ fontSize: 28 }}>{badge.icon}</div>

                        <div>
                          <div style={{ fontWeight: 700 }}>
                            {badge.name}
                          </div>

                          <div style={{ marginTop: 6, color: "#666" }}>
                            {badge.description}
                          </div>

                          <div
                            style={{
                              marginTop: 8,
                              color: "#4c7c59",
                              fontWeight: 700,
                            }}
                          >
                            Coupon: {badge.code}
                          </div>

                          <div style={{ marginTop: 4 }}>
                            Reward: {badge.reward}
                          </div>

                          <div style={{ marginTop: 6, fontSize: 13 }}>
                            Earned: {new Date(b.earned_at).toLocaleString()}
                          </div>

                          <div
                            style={{
                              marginTop: 8,
                              fontSize: 13,
                              color: "#6b8f74",
                            }}
                          >
                            Click to use reward
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div style={{ marginTop: 24 }}>
            <Link href="/book" className="btn btnPrimary">
              Book Appointment
            </Link>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}