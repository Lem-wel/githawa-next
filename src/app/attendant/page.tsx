"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Row = {
  id: number;
  appt_date: string;
  appt_time: string;
  duration_minutes: number;
  room_name: string | null;
  service_name: string | null;
  category: string | null;
  customer_name: string | null;
};

export default function AttendantPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [name, setName] = useState("");
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      setMsg("");

      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        router.push("/login");
        return;
      }

      // profile
      const { data: prof, error: pErr } = await supabase
        .from("profiles")
        .select("full_name, role, staff_id")
        .eq("id", user.id)
        .single();

      if (pErr || !prof) {
        setMsg("Profile not found.");
        return;
      }

      if (prof.role !== "staff") {
        router.push("/dashboard");
        return;
      }

      if (!prof.staff_id) {
        setMsg("Staff account not linked (profiles.staff_id is null).");
        return;
      }

      // staff position check
      const { data: st, error: sErr } = await supabase
        .from("staff")
        .select("name, position")
        .eq("id", prof.staff_id)
        .single();

      if (sErr || !st) {
        setMsg("Staff record missing.");
        return;
      }

      const position = (st.position || "").trim().toLowerCase();
      if (position !== "spa_attendant") {
        // send other staff to their proper pages
        if (position === "manager") router.push("/manager");
        else if (position === "receptionist") router.push("/receptionist");
        else router.push("/staff");
        return;
      }

      setName(st.name || prof.full_name || "Spa Attendant");

      // Load ONLY non-massage services assigned to this attendant
      const { data: appts, error: aErr } = await supabase
        .from("appointments")
        .select(`
          id,
          appt_date,
          appt_time,
          duration_minutes,
          rooms(name),
          services(name, category),
          customer:profiles!appointments_user_id_profiles_fkey(full_name)
        `)
        .eq("staff_id", prof.staff_id)
        .neq("services.category", "Massage Therapies")
        .order("appt_date", { ascending: true })
        .order("appt_time", { ascending: true });

      if (aErr) {
        setMsg(aErr.message);
        return;
      }

      const mapped: Row[] = (appts ?? []).map((r: any) => ({
        id: r.id,
        appt_date: r.appt_date,
        appt_time: String(r.appt_time).slice(0, 5),
        duration_minutes: r.duration_minutes,
        room_name: r.rooms?.name ?? null,
        service_name: r.services?.name ?? null,
        category: r.services?.category ?? null,
        customer_name: r.customer?.full_name ?? null,
      }));

      setRows(mapped);
    })();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main style={{ maxWidth: 980, margin: "40px auto", fontFamily: "Arial" }}>
      <h2>My Schedule</h2>
      <p style={{ marginTop: 4, color: "#555" }}>
        Hello, <b>{name}</b> (Spa Attendant)
      </p>

      <button onClick={logout} style={{ padding: "6px 10px", marginTop: 8 }}>
        Logout
      </button>

      {msg && <p style={{ color: "crimson", marginTop: 14 }}>{msg}</p>}

      <div style={{ marginTop: 18, border: "1px solid #eee", borderRadius: 14, padding: 14, background: "#fff" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>Date</th>
              <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>Time</th>
              <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>Customer</th>
              <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>Service</th>
              <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>Category</th>
              <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>Room</th>
              <th style={{ padding: 10, borderBottom: "1px solid #eee" }}>Duration</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 12 }}>No assigned non-massage appointments.</td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: 10, borderBottom: "1px solid #f3f3f3" }}>{r.appt_date}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f3f3f3" }}>{r.appt_time}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f3f3f3" }}>{r.customer_name ?? "—"}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f3f3f3" }}>{r.service_name ?? "—"}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f3f3f3" }}>{r.category ?? "—"}</td>
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