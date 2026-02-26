"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Row = {
  id: number;
  appt_date: string;
  appt_time: string;
  duration_minutes: number;
  service_name: string | null;
  room_name: string | null;
  customer_name: string | null;
};

export default function StaffPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      setMsg("");

      // must be logged in
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        router.push("/login");
        return;
      }

      // must be staff and must have staff_id
      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("role, staff_id")
        .eq("id", user.id)
        .single();

      if (pErr || !profile) {
        setMsg("Profile not found.");
        return;
      }

      if (profile.role !== "staff") {
        router.push("/dashboard");
        return;
      }

      if (!profile.staff_id) {
        setMsg("This staff account is not linked yet (profiles.staff_id missing).");
        return;
      }

      // Load appointments assigned to this staff
      // NOTE: This expects you have a view called staff_schedule_view (Step 2 below).
      const { data, error } = await supabase
        .from("staff_schedule_view")
        .select("*")
        .eq("staff_id", profile.staff_id)
        .order("appt_date", { ascending: true })
        .order("appt_time", { ascending: true });

      if (error) {
        setMsg(error.message);
        return;
      }

      setRows((data as any) ?? []);
    })();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main style={{ maxWidth: 980, margin: "40px auto", fontFamily: "Arial" }}>
      <h2 style={{ marginBottom: 10 }}>My Schedule</h2>

      <a href="#" onClick={(e) => { e.preventDefault(); logout(); }} style={{ color: "#6b21a8" }}>
        Logout
      </a>

      {msg && <p style={{ color: "crimson", marginTop: 14 }}>{msg}</p>}

      <div style={{ marginTop: 18, border: "1px solid #eee", borderRadius: 14, padding: 14, background: "#fff" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>Date</th>
              <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>Time</th>
              <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>Customer</th>
              <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>Service</th>
              <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>Room</th>
              <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>Duration</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 12 }}>No appointments assigned.</td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: 10, borderBottom: "1px solid #f3f3f3" }}>{r.appt_date}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f3f3f3" }}>{String(r.appt_time).slice(0, 5)}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f3f3f3" }}>{r.customer_name ?? "—"}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f3f3f3" }}>{r.service_name ?? "—"}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f3f3f3" }}>{r.room_name ?? "—"}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f3f3f3" }}>{r.duration_minutes} min</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}