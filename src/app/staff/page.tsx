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
  room_name: string | null;
  staff_name: string | null;
  status: string | null;
};

export default function StaffPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [staffName, setStaffName] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const visibleRows = selectedDate
    ? rows.filter((r) => r.appt_date === selectedDate)
    : rows;

  useEffect(() => {
    (async () => {
      setMsg("");

      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("full_name, role, staff_id")
        .eq("id", user.id)
        .single();

      if (pErr || !profile) {
        setMsg("Profile not found.");
        return;
      }

      const adminMode = profile.role === "admin";
      setIsAdmin(adminMode);

      if (!adminMode && profile.role !== "staff") {
        router.push("/dashboard");
        return;
      }

      if (adminMode) {
        setStaffName(profile.full_name || "Admin");

        const { data: appts, error: aErr } = await supabase
          .from("appointments")
          .select(`
            id,
            appt_date,
            appt_time,
            duration_minutes,
            status,
            rooms(name),
            services(name, category),
            staff(name, position),
            customer:profiles!appointments_user_id_profiles_fkey(full_name)
          `)
          .eq("services.category", "Massage Therapies")
          .order("appt_date", { ascending: true })
          .order("appt_time", { ascending: true });

        if (aErr) {
          setMsg(aErr.message);
          return;
        }

        setRows(
          (appts ?? []).map((r: any) => ({
            id: r.id,
            appt_date: r.appt_date,
            appt_time: String(r.appt_time).slice(0, 5),
            duration_minutes: r.duration_minutes,
            customer_name: r.customer?.full_name ?? null,
            service_name: r.services?.name ?? null,
            room_name: r.rooms?.name ?? null,
            staff_name: r.staff?.name ?? null,
            status: r.status ?? "confirmed",
          }))
        );
        return;
      }

      if (!profile.staff_id) {
        setMsg("Staff not linked (profiles.staff_id is null).");
        return;
      }

      const { data: st, error: stErr } = await supabase
        .from("staff")
        .select("name, position")
        .eq("id", profile.staff_id)
        .single();

      if (stErr || !st) {
        setMsg("Staff record missing.");
        return;
      }

      const position = String(st.position || "").trim().toLowerCase();

      if (position !== "massage_therapist") {
        if (position === "manager") router.push("/manager");
        else if (position === "receptionist") router.push("/receptionist");
        else if (position === "spa_attendant") router.push("/attendant");
        else router.push("/dashboard");
        return;
      }

      setStaffName(st.name || profile.full_name || "Massage Therapist");

      const { data: appts, error: aErr } = await supabase
        .from("appointments")
        .select(`
          id,
          appt_date,
          appt_time,
          duration_minutes,
          status,
          rooms(name),
          services(name, category),
          staff(name),
          customer:profiles!appointments_user_id_profiles_fkey(full_name)
        `)
        .eq("staff_id", profile.staff_id)
        .eq("services.category", "Massage Therapies")
        .neq("status", "cancelled")
        .order("appt_date", { ascending: true })
        .order("appt_time", { ascending: true });

      if (aErr) {
        setMsg(aErr.message);
        return;
      }

      setRows(
        (appts ?? []).map((r: any) => ({
          id: r.id,
          appt_date: r.appt_date,
          appt_time: String(r.appt_time).slice(0, 5),
          duration_minutes: r.duration_minutes,
          customer_name: r.customer?.full_name ?? null,
          service_name: r.services?.name ?? null,
          room_name: r.rooms?.name ?? null,
          staff_name: r.staff?.name ?? null,
          status: r.status ?? "confirmed",
        }))
      );
    })();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <SiteShell>
      <div className="card cardPad">
        <h2 style={{ marginTop: 0 }}>
          {isAdmin ? "All Staff Schedules" : "My Schedule"}
        </h2>

        <p style={{ color: "var(--muted)" }}>
          Hello, <b>{staffName}</b>{" "}
          ({isAdmin ? "Admin viewing all staff schedules" : "Massage Therapist"})
        </p>

        <button className="btn" onClick={logout}>Logout</button>

        {msg && <div className="notice" style={{ marginTop: 12 }}>{msg}</div>}
      </div>

      <div className="card cardPad" style={{ marginTop: 14 }}>
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <label htmlFor="staff-day-filter" style={{ fontWeight: 700 }}>
            Calendar:
          </label>
          <input
            id="staff-day-filter"
            className="input"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          {selectedDate && (
            <button className="btn" onClick={() => setSelectedDate("")}>
              Show all
            </button>
          )}
          <span style={{ color: "var(--muted)" }}>
            {selectedDate
              ? `Showing schedules on ${selectedDate}`
              : "Showing all schedules"}
          </span>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              {isAdmin && <th>Staff</th>}
              <th>Customer</th>
              <th>Service</th>
              <th>Room</th>
              <th>Duration</th>
              {isAdmin && <th>Status</th>}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 6}>
                  {selectedDate
                    ? "No massage appointments assigned for this day."
                    : "No massage appointments assigned."}
                </td>
              </tr>
            ) : visibleRows.map((r) => (
              <tr
                key={r.id}
                style={
                  isAdmin && r.status === "cancelled"
                    ? { opacity: 0.6, background: "#fff4f4" }
                    : undefined
                }
              >
                <td>{r.appt_date}</td>
                <td>{r.appt_time}</td>
                {isAdmin && <td>{r.staff_name ?? "—"}</td>}
                <td>{r.customer_name ?? "—"}</td>
                <td>{r.service_name ?? "—"}</td>
                <td>{r.room_name ?? "—"}</td>
                <td>{r.duration_minutes} min</td>
                {isAdmin && (
                  <td>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                        background:
                          r.status === "cancelled" ? "#fde2e2" : "#e8f7ec",
                        color:
                          r.status === "cancelled" ? "#b42318" : "#18794e",
                      }}
                    >
                      {r.status === "cancelled" ? "Cancelled" : "Confirmed"}
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SiteShell>
  );
}