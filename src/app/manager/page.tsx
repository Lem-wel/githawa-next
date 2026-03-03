"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Appt = {
  id: number;
  appt_date: string;
  appt_time: string;
  duration_minutes: number | null;
  staff_id: number | null;
  room_id: number | null;
  services?: { name?: string } | null;
  rooms?: { name?: string } | null;
  customer?: { full_name?: string } | null;
};

export default function ManagerPage() {
  const router = useRouter();
  const [appts, setAppts] = useState<Appt[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      // must be logged in
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.push("/login");
        return;
      }

      // Check if manager using profiles->staff.position
      const { data: prof, error: perr } = await supabase
        .from("profiles")
        .select("role, staff_id")
        .eq("id", auth.user.id)
        .single();

      if (perr || !prof || prof.role !== "staff" || !prof.staff_id) {
        router.push("/dashboard");
        return;
      }

      const { data: st, error: sterr } = await supabase
        .from("staff")
        .select("position")
        .eq("id", prof.staff_id)
        .single();

      if (sterr || !st || st.position !== "manager") {
        router.push("/staff");
        return;
      }

      await loadData();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    setLoading(true);
    setMsg("");

    // ✅ appointments with customer join (uses your FK name)
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        appt_date,
        appt_time,
        duration_minutes,
        staff_id,
        room_id,
        services(name),
        rooms(name),
        customer:profiles!appointments_user_id_profiles_fkey(full_name)
      `)
      .order("appt_date", { ascending: true })
      .order("appt_time", { ascending: true });

    if (error) {
      setMsg("QUERY ERROR: " + error.message);
      setAppts([]);
      setLoading(false);
      return;
    }

    // load staff list + rooms for dropdowns
    const { data: stList, error: stErr } = await supabase
      .from("staff")
      .select("id, name, position")
      .order("id", { ascending: true });

    const { data: rmList, error: rmErr } = await supabase
      .from("rooms")
      .select("id, name")
      .order("id", { ascending: true });

    if (stErr) setMsg((m) => (m ? m + " | " : "") + "Staff error: " + stErr.message);
    if (rmErr) setMsg((m) => (m ? m + " | " : "") + "Rooms error: " + rmErr.message);

    setAppts((data ?? []) as any);
    setStaff(stList ?? []);
    setRooms(rmList ?? []);
    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function save(apptId: number, vals: { appt_date: string; appt_time: string; staff_id: number; room_id: number }) {
  setMsg("");

  const ok = confirm("Save changes to this appointment?");
  if (!ok) return;

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    setMsg("Unauthorized (no session token). Please logout/login again.");
    return;
  }

  const res = await fetch("/api/manager/reschedule", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      appointmentId: apptId,
      appt_date: vals.appt_date,
      appt_time: vals.appt_time,
      staff_id: vals.staff_id,
      room_id: vals.room_id,
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    setMsg(json.error || "Failed to update");
    return;
  }

  setMsg("Appointment updated ✅");
  await loadData();
}

  return (
    <main style={{ maxWidth: 1050, margin: "40px auto", fontFamily: "Arial" }}>
      <h2>Manager — Reschedule / Reassign</h2>
      <p style={{ color: "#666" }}>You can change date, time, therapist, or room for each booking.</p>

      <button onClick={logout} style={{ padding: "6px 10px", marginTop: 8 }}>
        Logout
      </button>

      <p style={{ marginTop: 12, color: "#666" }}>Rows loaded: {appts.length}</p>
      {loading && <p>Loading...</p>}
      {msg && <p style={{ color: msg.includes("✅") ? "green" : "crimson" }}>{msg}</p>}

      <div style={{ marginTop: 16, border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#fafafa" }}>
            <tr>
              <th style={{ textAlign: "left", padding: 10 }}>Date</th>
              <th style={{ textAlign: "left", padding: 10 }}>Time</th>
              <th style={{ textAlign: "left", padding: 10 }}>Customer</th>
              <th style={{ textAlign: "left", padding: 10 }}>Service</th>
              <th style={{ textAlign: "left", padding: 10 }}>Therapist</th>
              <th style={{ textAlign: "left", padding: 10 }}>Room</th>
              <th style={{ textAlign: "left", padding: 10 }}>Action</th>
            </tr>
          </thead>

          <tbody>
            {appts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 12 }}>
                  No appointments found.
                </td>
              </tr>
            ) : (
              appts.map((a) => (
                <ManagerRow key={a.id} appt={a} staff={staff} rooms={rooms} onSave={(vals) => save(a.id, vals)} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function ManagerRow({
  appt,
  staff,
  rooms,
  onSave,
}: {
  appt: Appt;
  staff: any[];
  rooms: any[];
  onSave: (vals: { appt_date: string; appt_time: string; staff_id: number; room_id: number }) => void;
}) {
  const [date, setDate] = useState(appt.appt_date ?? "");
  const [time, setTime] = useState(String(appt.appt_time ?? "").slice(0, 5));
  const [staffId, setStaffId] = useState<number>(appt.staff_id ?? 0);
  const [roomId, setRoomId] = useState<number>(appt.room_id ?? 0);

  return (
    <tr style={{ borderTop: "1px solid #eee" }}>
      <td style={{ padding: 10 }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </td>

      <td style={{ padding: 10 }}>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </td>

      <td style={{ padding: 10 }}>{appt.customer?.full_name ?? "—"}</td>
      <td style={{ padding: 10 }}>{appt.services?.name ?? "—"}</td>

      <td style={{ padding: 10 }}>
        <select value={staffId || ""} onChange={(e) => setStaffId(Number(e.target.value))}>
          <option value="">Select therapist</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.position})
            </option>
          ))}
        </select>
      </td>

      <td style={{ padding: 10 }}>
        <select value={roomId || ""} onChange={(e) => setRoomId(Number(e.target.value))}>
          <option value="">Select room</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </td>

      <td style={{ padding: 10 }}>
        <button
          onClick={() =>
            onSave({
              appt_date: date,
              appt_time: time,
              staff_id: staffId,
              room_id: roomId,
            })
          }
        >
          Save
        </button>
      </td>
    </tr>
  );
}