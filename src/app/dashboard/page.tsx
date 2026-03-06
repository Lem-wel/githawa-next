"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
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

export default function DashboardPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("");

  const [fullName, setFullName] = useState("Customer");
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");

  const [bookingCount, setBookingCount] = useState(0);

  const [showBookings, setShowBookings] = useState(false);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const [unlockedBadges, setUnlockedBadges] = useState<any[]>([]);
  const [showUnlocked, setShowUnlocked] = useState(false);

  useEffect(() => {
    (async () => {
      setMsg("");

      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return router.push("/login");

      setEmail(auth.user.email ?? "");

      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, role, referral_code")
        .eq("id", auth.user.id)
        .single();

      if (prof?.role === "staff") {
        router.push("/staff");
        return;
      }

      setFullName(prof?.full_name || "Customer");
      setReferralCode(prof?.referral_code || "");

      const { count: apptCount } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", auth.user.id);

      setBookingCount(apptCount ?? 0);

      const { data: ub, error: ubErr } = await supabase
        .from("user_badges")
        .select(`
          earned_at,
          badge:badges (
            id,
            name,
            description,
            icon
          )
        `)
        .eq("user_id", auth.user.id)
        .order("earned_at", { ascending: false });

      if (ubErr) {
        setMsg(ubErr.message);
      } else {
        setUnlockedBadges(ub ?? []);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadBookings() {
    setLoadingBookings(true);
    setMsg("");

    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      setLoadingBookings(false);
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        appt_date,
        appt_time,
        duration_minutes,
        services(name),
        rooms(name),
        staff(name)
      `)
      .eq("user_id", uid)
      .order("appt_date", { ascending: true })
      .order("appt_time", { ascending: true });

    if (error) {
      setMsg(error.message);
      setBookings([]);
    } else {
      setBookings((data ?? []) as any);
    }

    setLoadingBookings(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function onClickBookings() {
    const next = !showBookings;
    setShowBookings(next);

    if (!showBookings) await loadBookings();
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

  return (
    <SiteShell>
      <div
        className="card cardPad"
        style={{
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Dashboard</h2>

        <div className="profileBox">
          <div className="profileName">👤 {fullName}</div>
          <div className="profileMeta">{email}</div>
          <div className="profileMeta">
            Status: <span className="profileStatus">Active</span>
          </div>
        </div>

        {/* Referral Code */}
        <div className="card cardPad" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Your Referral Code</h3>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div className="pill">{referralCode || "No referral code yet"}</div>
            <button className="btn" onClick={copyReferralCode} disabled={!referralCode}>
              Copy Code
            </button>
          </div>
          <p style={{ color: "var(--muted)", marginTop: 10, marginBottom: 0 }}>
            Share this code with friends when they sign up.
          </p>
        </div>

        {/* Pills summary */}
        <div className="pillRow" style={{ marginTop: 16 }}>
          <button className="pill" onClick={onClickBookings} type="button">
            Bookings <b style={{ marginLeft: 6 }}>{bookingCount}</b>
          </button>

          <button
            className="pill"
            onClick={() => setShowUnlocked((v) => !v)}
            type="button"
          >
            Badges <span className="pillNum">{unlockedBadges.length}</span>
          </button>
        </div>

        {/* Unlocked badges */}
        {showUnlocked && (
          <div className="card cardPad" style={{ marginTop: 14 }}>
            <h3 style={{ marginTop: 0 }}>Unlocked Badges</h3>

            {unlockedBadges.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>No badges unlocked yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {unlockedBadges.map((row: any) => (
                  <div
                    key={row.badge.id}
                    className="card cardPad"
                    style={{ display: "flex", gap: 12 }}
                  >
                    <div style={{ fontSize: 26 }}>{row.badge.icon ?? "🏅"}</div>

                    <div>
                      <b>{row.badge.name}</b>

                      <div style={{ color: "var(--muted)", fontSize: 13 }}>
                        {row.badge.description}
                      </div>

                      <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
                        Unlocked: {new Date(row.earned_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bookings list */}
        {showBookings && (
          <div className="card cardPad" style={{ marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>My Scheduled Bookings</h3>

            {loadingBookings ? (
              <p style={{ color: "var(--muted)" }}>Loading…</p>
            ) : bookings.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>No bookings yet.</p>
            ) : (
              <div className="tableWrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Service</th>
                      <th>Staff</th>
                      <th>Room</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id}>
                        <td>{b.appt_date}</td>
                        <td>{String(b.appt_time).slice(0, 5)}</td>
                        <td>{b.services?.name ?? "—"}</td>
                        <td>{b.staff?.name ?? "—"}</td>
                        <td>{b.rooms?.name ?? "—"}</td>
                        <td>{b.duration_minutes ? `${b.duration_minutes} min` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {msg && (
          <div className="notice" style={{ marginTop: 12 }}>
            {msg}
          </div>
        )}

        {/* Main tabs */}
        <div className="actionGrid" style={{ marginTop: 20 }}>
          <Link className="btn btnPrimary" href="/book">
            Book Appointment
          </Link>
          <Link className="btn" href="/services">
            Spa Services
          </Link>
          <Link className="btn" href="/activities">
            Wellness Activities
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}