// src/app/manager/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Appt = {
  id: number;
  appt_date: string;
  appt_time: string;
  duration_minutes: number | null;
  room_id: number | null;
  staff_id: number | null;
  user_id: string | null;
  services?: { name?: string } | null;
  rooms?: { name?: string } | null;
  profiles?: { full_name?: string } | null;
};

export default function ManagerPage() {
  const router = useRouter();
  const [appts, setAppts] = useState<Appt[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      // verify logged in + position using staff_identity_view
      const { data: auth } = await supabase.auth.getUser();
const user = auth.user;
if (!user) { router.push("/login"); return; }

const { data: prof, error: perr } = await supabase
  .from("profiles")
  .select("role, staff_id")
  .eq("id", user.id)
  .single();

if (perr || !prof) { router.push("/dashboard"); return; }
if (prof.role !== "staff" || !prof.staff_id) { router.push("/dashboard"); return; }

const { data: st, error: serr } = await supabase
  .from("staff")
  .select("position")
  .eq("id", prof.staff_id)
  .single();

if (serr || !st || st.position !== "manager") {
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
    customer:profiles!appointments_user_id_fkey(full_name)
  `)
  .order("appt_date", { ascending: true })
  .order("appt_time", { ascending: true });



    setLoading(false);
  }

  async function handleUpdate(apptId: number, newVals: { appt_date: string; appt_time: string; staff_id: number; room_id: number; }) {
    setMsg("");
    const ok = confirm("Are you sure you want to update this appointment?");
    if (!ok) return;

    try {
      const res = await fetch("/api/manager/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          appointmentId: apptId,
          appt_date: newVals.appt_date,
          appt_time: newVals.appt_time,
          staff_id: newVals.staff_id,
          room_id: newVals.room_id
        })
      });

      const json = await res.json();
      if (!res.ok) {
        setMsg(json.error || "Failed to update");
        return;
      }

      setMsg("Appointment updated.");
      // refresh list
      await loadData();
    } catch (err: any) {
      setMsg(err.message || "Network error");
    }
  }

  return (
    <main style={{ maxWidth: 1000, margin: "40px auto", fontFamily: "Arial" }}>
      <h2>Manager — Reschedule / Reassign</h2>
      <p style={{ color: "#666" }}>You can change date, time, therapist, or room for each booking.</p>

      {msg && <p style={{ color: msg.includes("updated") ? "green" : "crimson" }}>{msg}</p>}
      {loading && <p>Loading…</p>}

      <div style={{ marginTop: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 8 }}>Date</th>
              <th style={{ textAlign: "left", padding: 8 }}>Time</th>
              <th style={{ textAlign: "left", padding: 8 }}>Customer</th>
              <th style={{ textAlign: "left", padding: 8 }}>Service</th>
              <th style={{ textAlign: "left", padding: 8 }}>Therapist</th>
              <th style={{ textAlign: "left", padding: 8 }}>Room</th>
              <th style={{ textAlign: "left", padding: 8 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {appts.map((r) => (
              <ManagerRow
                key={r.id}
                appt={r}
                staff={staff}
                rooms={rooms}
                onSave={(vals) => handleUpdate(r.id, vals)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function ManagerRow({ appt, staff, rooms, onSave }: { appt: any; staff: any[]; rooms: any[]; onSave: (vals: any) => void; }) {
  const [date, setDate] = useState(appt.appt_date ?? "");
  const [time, setTime] = useState(String(appt.appt_time ?? "").slice(0,5) ?? "");
  const [staffId, setStaffId] = useState<number>(appt.staff_id ?? 0);
  const [roomId, setRoomId] = useState<number>(appt.room_id ?? 0);

  return (
    <tr style={{ borderTop: "1px solid #eee" }}>
      <td style={{ padding: 8 }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </td>
      <td style={{ padding: 8 }}>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </td>
      <td style={{ padding: 8 }}>{appt.profiles?.full_name ?? "—"}</td>
      <td style={{ padding: 8 }}>{appt.services?.name ?? "—"}</td>
      <td style={{ padding: 8 }}>
        <select value={staffId ?? ""} onChange={(e) => setStaffId(Number(e.target.value))}>
          <option value="">Select</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.position})</option>)}
        </select>
      </td>
      <td style={{ padding: 8 }}>
        <select value={roomId ?? ""} onChange={(e) => setRoomId(Number(e.target.value))}>
          <option value="">Select</option>
          {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </td>
      <td style={{ padding: 8 }}>
        <button onClick={() => onSave({ appt_date: date, appt_time: time, staff_id: staffId, room_id: roomId })}>
          Save
        </button>
      </td>
    </tr>
  );
}