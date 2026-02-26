"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Appt = {
  id: number;
  appt_date: string;
  appt_time: string;
  duration_minutes: number;
  notes: string | null;
  rooms: { name: string } | null;
  services: { name: string } | null;
};

export default function StaffPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [name, setName] = useState("");
  const [rows, setRows] = useState<Appt[]>([]);

  useEffect(() => {
    (async () => {
      setMsg("");

      // 1) must be logged in
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        router.push("/login");
        return;
      }

      // 2) must be staff + must have staff_id
      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("full_name, role, staff_id")
        .eq("id", user.id)
        .single();

      if (pErr || !profile) {
        setMsg("Profile not found.");
        return;
      }

      setName(profile.full_name ?? "Staff");

      if (profile.role !== "staff") {
        router.push("/dashboard");
        return;
      }

      if (!profile.staff_id) {
        setMsg("This staff account is not linked yet (profiles.staff_id is empty).");
        return;
      }

      // 3) load staff appointments
      const { data: appts, error: aErr } = await supabase
        .from("appointments")
        .select("id, appt_date, appt_time, duration_minutes, notes, rooms(name), services(name)")
        .eq("staff_id", profile.staff_id)
        .order("appt_date", { ascending: true })
        .order("appt_time", { ascending: true });

      if (aErr) {
        setMsg(aErr.message);
        return;
      }

      setRows((appts as any) ?? []);
    })();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main style={{ maxWidth: 1000, margin: "40px auto", fontFamily: "Arial" }}>
      <h2>Staff Panel</h2>
      <p style={{ color: "#666" }}>Welcome, <b>{name}</b></p>

      {/* Staff-only tabs */}
      <nav style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "14px 0 18px" }}>
        <Link href="/staff">My Schedule</Link>
        <Link href="/services">Services</Link>
        <button onClick={logout} style={{ padding: "6px 10px" }}>Logout</button>
      </nav>

      {msg && <p style={{ color: "crimson" }}>{msg}</p>}

      {!msg && rows.length === 0 && <p>No appointments assigned yet.</p>}

      {rows.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
          <thead>
            <tr>
              <th align="left">Date</th>
              <th align="left">Time</th>
              <th align="left">Service</th>
              <th align="left">Room</th>
              <th align="left">Duration</th>
              <th align="left">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ padding: 10, borderTop: "1px solid #eee" }}>{r.appt_date}</td>
                <td style={{ padding: 10, borderTop: "1px solid #eee" }}>{String(r.appt_time).slice(0, 5)}</td>
                <td style={{ padding: 10, borderTop: "1px solid #eee" }}>{r.services?.name ?? "—"}</td>
                <td style={{ padding: 10, borderTop: "1px solid #eee" }}>{r.rooms?.name ?? "—"}</td>
                <td style={{ padding: 10, borderTop: "1px solid #eee" }}>{r.duration_minutes} min</td>
                <td style={{ padding: 10, borderTop: "1px solid #eee" }}>{r.notes ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}