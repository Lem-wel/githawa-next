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

  const [bookingCount, setBookingCount] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);

  // ✅ toggle
  const [showBookings, setShowBookings] = useState(false);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    (async () => {
      setMsg("");

      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return router.push("/login");

      setEmail(auth.user.email ?? "");

      // profile
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", auth.user.id)
        .single();

      if (prof?.role === "staff") {
        // staff should not use customer dashboard
        router.push("/staff");
        return;
      }

      setFullName(prof?.full_name || "Customer");

      // count appointments
      const { count: apptCount } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", auth.user.id);

      setBookingCount(apptCount ?? 0);

      // count badges (if you have user_badges table)
      const { count: bCount } = await supabase
        .from("user_badges")
        .select("id", { count: "exact", head: true })
        .eq("user_id", auth.user.id);

      setBadgeCount(bCount ?? 0);
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

    // load only when opening
    if (!showBookings) await loadBookings();
  }

  return (
    <SiteShell>
      <div className="card cardPad">
        <h2 style={{ marginTop: 0 }}>Dashboard</h2>

        <div style={{ color: "var(--muted)" }}>
          <div>
            Welcome, <b>{fullName}</b>
          </div>
          <div>{email}</div>
        </div>

        {/* ✅ Pills summary */}
        <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
          {/* ✅ clickable */}
          <button className="pill" onClick={onClickBookings} type="button">
            Bookings <b style={{ marginLeft: 6 }}>{bookingCount}</b>
          </button>

          <Link className="pill" href="/badges">
            Badges <b style={{ marginLeft: 6 }}>{badgeCount}</b>
          </Link>

          <span className="pill">
            Status <b style={{ marginLeft: 6 }}>Active</b>
          </span>

          {/* ✅ removed Wellness pill */}
        </div>

        {/* ✅ Bookings list appears after click */}
        {showBookings && (
          <div className="card cardPad" style={{ marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>My Scheduled Bookings</h3>

            {loadingBookings ? (
              <p style={{ color: "var(--muted)" }}>Loading…</p>
            ) : bookings.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>No bookings yet.</p>
            ) : (
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
            )}
          </div>
        )}

        {msg && <div className="notice" style={{ marginTop: 12 }}>{msg}</div>}

        {/* ✅ Main tabs */}
        <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="btn" href="/services">Spa Services</Link>
          <Link className="btn btnPrimary" href="/book">Book Appointment</Link>
          <Link className="btn" href="/badges">Badges</Link>
          <Link className="btn" href="/activities">Wellness Activities</Link>
          <button className="btn" onClick={logout}>Logout</button>
        </div>
      </div>
    </SiteShell>
  );
}