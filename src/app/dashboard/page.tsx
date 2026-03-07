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
  const [referralUnlocked, setReferralUnlocked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [bookingCount, setBookingCount] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);

  const [activeTab, setActiveTab] =
    useState<"bookings" | "badges" | "referral" | null>(null);

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [badges, setBadges] = useState<BadgeRow[]>([]);
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setMsg("");
    setPageReady(false);

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      router.replace("/login");
      return;
    }

    setEmail(user.email || "");

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("full_name, referral_code, referral_unlocked, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileErr) {
      setMsg(profileErr.message);
      setPageReady(true);
      return;
    }

    if (!profile) {
      router.replace("/login");
      return;
    }

    if (profile.role !== "customer" && profile.role !== "admin") {
      if (profile.role === "manager") {
        router.replace("/manager");
      } else if (profile.role === "receptionist") {
        router.replace("/receptionist");
      } else if (
        profile.role === "staff" ||
        profile.role === "spa_attendant" ||
        profile.role === "massage_therapist"
      ) {
        router.replace("/staff");
      } else {
        router.replace("/");
      }
      return;
    }

    const adminMode = profile.role === "admin";
    setIsAdmin(adminMode);

    setFullName(profile.full_name || (adminMode ? "Admin" : "Customer"));
    setReferralCode(profile.referral_code || "");
    setReferralUnlocked(profile.referral_unlocked ?? false);

    const { data: bookingData, error: bookingErr } = await supabase
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

    if (!bookingErr) {
      const safeBookings = (bookingData ?? []) as BookingRow[];
      setBookings(safeBookings);
      setBookingCount(safeBookings.length);
    } else {
      setMsg(bookingErr.message);
    }

    const { data: badgeData, error: badgeErr } = await supabase
      .from("user_badges")
      .select("earned_at, badges(name, description, icon, code, reward)")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false });

    if (!badgeErr) {
      const safeBadges = (badgeData ?? []) as BadgeRow[];
      setBadges(safeBadges);
      setBadgeCount(safeBadges.length);
    } else {
      setMsg(badgeErr.message);
    }

    setPageReady(true);
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
      reward: b?.reward || "",
    };
  }

  async function handleBadgeClick(badge: Required<BadgeInfo>) {
    if (!badge.code) {
      setMsg("This badge has no coupon code.");
      setTimeout(() => setMsg(""), 1500);
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

  async function copyReferralCode() {
    if (!referralCode) return;

    try {
      await navigator.clipboard.writeText(referralCode);
      setMsg("Referral code copied ✅");
      setTimeout(() => setMsg(""), 1500);
    } catch {
      setMsg("Failed to copy referral code.");
    }
  }

  if (!pageReady) {
    return (
      <SiteShell>
        <div style={{ maxWidth: 1100, margin: "20px auto" }}>
          <div className="card cardPad">Loading...</div>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div style={{ maxWidth: 1100, margin: "20px auto" }}>
        {msg && (
          <div className="notice" style={{ marginBottom: 12 }}>
            {msg}
          </div>
        )}

        {isAdmin && (
          <div className="notice" style={{ marginBottom: 12 }}>
            Admin mode: you can access the customer dashboard here.
          </div>
        )}

        <div className="card cardPad">
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{fullName}</div>
            <div style={{ marginTop: 4, color: "#87a98e", fontWeight: 600 }}>
              Status: Active
            </div>
            {email && (
              <div style={{ marginTop: 6, color: "var(--muted)" }}>{email}</div>
            )}
          </div>

          {isAdmin && (
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 18,
              }}
            >
              <Link href="/manager" className="btn">
                Open Manager
              </Link>
              <Link href="/receptionist" className="btn">
                Open Receptionist
              </Link>
              <Link href="/staff" className="btn">
                Open Staff
              </Link>
            </div>
          )}

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
              onClick={() => toggleTab("bookings")}
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
              type="button"
            >
              Bookings {bookingCount}
            </button>

            <button
              className="btn"
              onClick={() => toggleTab("badges")}
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
              type="button"
            >
              Badges {badgeCount}
            </button>

            <button
              className="btn"
              onClick={() => toggleTab("referral")}
              style={{
                borderRadius: 999,
                padding: "12px 18px",
                border:
                  activeTab === "referral"
                    ? "2px solid #222"
                    : "1px solid var(--border)",
                background: "#eaf1ec",
                fontWeight: 700,
              }}
              type="button"
            >
              Referral
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
                      {bookings.map((b) => {
                        const addonNames =
                          b.appointment_addons
                            ?.map((a) => a.addon_service?.name)
                            .filter(Boolean)
                            .join(", ") || "";

                        return (
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
                              {b.appt_date} at {String(b.appt_time).slice(0, 5)}
                            </div>

                            <div style={{ color: "var(--muted)", marginTop: 4 }}>
                              Staff: {b.staff?.name || "Not assigned"} | Room:{" "}
                              {b.rooms?.name || "N/A"}
                            </div>

                            {addonNames && (
                              <div style={{ color: "var(--muted)", marginTop: 4 }}>
                                Add-ons: {addonNames}
                              </div>
                            )}

                            <div style={{ color: "var(--muted)", marginTop: 4 }}>
                              Duration:{" "}
                              {b.duration_minutes
                                ? `${b.duration_minutes} min`
                                : "N/A"}
                            </div>
                          </div>
                        );
                      })}
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

                  {badges.length === 0 ? (
                    <p style={{ color: "var(--muted)", fontSize: 16 }}>
                      No badges unlocked yet.
                    </p>
                  ) : (
                    <div style={{ display: "grid", gap: 14 }}>
                      {badges.map((b, i) => {
                        const badge = normalizeBadge(b.badges);

                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleBadgeClick(badge)}
                            style={{
                              border: "1px solid #dfe5df",
                              borderRadius: 22,
                              padding: "18px 20px",
                              background: "#fff",
                              textAlign: "left",
                              cursor: badge.code ? "pointer" : "default",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 12,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 28,
                                  lineHeight: 1,
                                  minWidth: 34,
                                  display: "flex",
                                  justifyContent: "center",
                                  paddingTop: 2,
                                }}
                              >
                                {badge.icon || "🏅"}
                              </div>

                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 17 }}>
                                  {badge.name}
                                </div>

                                <div style={{ color: "var(--muted)", marginTop: 6 }}>
                                  {badge.description}
                                </div>

                                {badge.code && (
                                  <div
                                    style={{
                                      marginTop: 8,
                                      color: "#4c7c59",
                                      fontWeight: 700,
                                    }}
                                  >
                                    Coupon: {badge.code}
                                  </div>
                                )}

                                {badge.reward && (
                                  <div style={{ marginTop: 4, color: "var(--muted)" }}>
                                    Reward: {badge.reward}
                                  </div>
                                )}

                                <div style={{ color: "var(--muted)", marginTop: 6 }}>
                                  Earned: {new Date(b.earned_at).toLocaleString()}
                                </div>

                                {badge.code && (
                                  <div
                                    style={{
                                      marginTop: 8,
                                      fontSize: 13,
                                      color: "#6b8f74",
                                      fontWeight: 600,
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
                  )}
                </>
              )}

              {activeTab === "referral" && (
                <>
                  <h2 style={{ marginTop: 0 }}>Your Referral Code</h2>

                  <div
                    style={{
                      padding: 20,
                      borderRadius: 18,
                      border: "1px solid var(--border)",
                      background: "#f6f6f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ color: "var(--muted)", marginBottom: 6 }}>
                        Share this code with friends when they sign up.
                      </div>

                      <div
                        style={{
                          fontSize: 22,
                          fontWeight: 700,
                          letterSpacing: 1,
                        }}
                      >
                        {referralCode || "No referral code yet"}
                      </div>
                    </div>

                    <button
                      className="btn"
                      onClick={copyReferralCode}
                      disabled={!referralCode}
                      type="button"
                    >
                      Copy Code
                    </button>
                  </div>

                  {referralUnlocked && (
                    <div style={{ marginTop: 12, color: "#4c7c59", fontWeight: 700 }}>
                      Referral rewards unlocked
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