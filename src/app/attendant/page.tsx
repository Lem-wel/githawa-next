"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import SiteShell from "@/components/SiteShell";

type Row = {
  id: number;
  appt_date: string;
  appt_time: string;
  duration_minutes: number;
  customer_name: string | null;
  service_name: string | null;
  category: string | null;
  room_name: string | null;
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
      if (!auth.user) return router.push("/login");

      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, role, staff_id")
        .eq("id", auth.user.id)
        .single();

      if (!prof) return setMsg("Profile not found.");
      if (prof.role !== "staff") return router.push("/dashboard");
      if (!prof.staff_id) return setMsg("Staff not linked (profiles.staff_id is null).");

      const { data: st } = await supabase
        .from("staff")
        .select("name, position")
        .eq("id", prof.staff_id)
        .single();

      const position = String(st?.position || "").trim().toLowerCase();
      if (position !== "spa_attendant") {
        if (position === "manager") router.push("/manager");
        else if (position === "receptionist") router.push("/receptionist");
        else if (position === "massage_therapist") router.push("/staff");
        else router.push("/dashboard");
        return;
      }

      setName(st?.name || prof.full_name || "Spa Attendant");

      const { data: appts, error } = await supabase
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

      if (error) return setMsg(error.message);

      setRows((appts ?? []).map((r: any) => ({
        id: r.id,
        appt_date: r.appt_date,
        appt_time: String(r.appt_time).slice(0, 5),
        duration_minutes: r.duration_minutes,
        customer_name: r.customer?.full_name ?? null,
        service_name: r.services?.name ?? null,
        category: r.services?.category ?? null,
        room_name: r.rooms?.name ?? null,
      })));
    })();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <SiteShell>
      <div className="card cardPad">
        <h2 style={{ marginTop: 0 }}>My Schedule</h2>
        <p style={{ color: "var(--muted)" }}>Hello, <b>{name}</b> (Spa Attendant)</p>
        <button className="btn" onClick={logout}>Logout</button>
        {msg && <div className="notice" style={{ marginTop: 12 }}>{msg}</div>}
      </div>

      <div className="card cardPad" style={{ marginTop: 14 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th><th>Time</th><th>Customer</th><th>Service</th><th>Category</th><th>Room</th><th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7}>No assigned non-massage appointments.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id}>
                <td>{r.appt_date}</td>
                <td>{r.appt_time}</td>
                <td>{r.customer_name ?? "—"}</td>
                <td>{r.service_name ?? "—"}</td>
                <td>{r.category ?? "—"}</td>
                <td>{r.room_name ?? "—"}</td>
                <td>{r.duration_minutes} min</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SiteShell>
  );
}