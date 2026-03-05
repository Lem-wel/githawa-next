"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import SiteShell from "@/components/SiteShell";

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

type StaffRow = {
  id: number;
  name: string;
  position: string;
};

type RoomRow = {
  id: number;
  name: string;
};

export default function ManagerPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("");

  const [appts, setAppts] = useState<Appt[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [rooms, setRooms] = useState<RoomRow[]>([]);

  const [managerName, setManagerName] = useState("Manager");

  useEffect(() => {
    (async () => {
      setMsg("");

      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return router.push("/login");

      const { data: prof, error: pErr } = await supabase
        .from("profiles")
        .select("role, staff_id, full_name")
        .eq("id", auth.user.id)
        .single();

      if (pErr || !prof || prof.role !== "staff" || !prof.staff_id) {
        router.push("/dashboard");
        return;
      }

      const { data: st, error: sErr } = await supabase
        .from("staff")
        .select("name, position")
        .eq("id", prof.staff_id)
        .single();

      if (sErr || !st) {
        router.push("/staff");
        return;
      }

      const pos = String(st.position || "").trim().toLowerCase();
      if (pos !== "manager") {
        if (pos === "receptionist") router.push("/receptionist");
        else if (pos === "spa_attendant") router.push("/attendant");
        else router.push("/staff");
        return;
      }

      setManagerName(st.name || prof.full_name || "Manager");

      await loadData();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
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
        customer:profiles!appointments_user_id_profiles_fkey(full_name)
      `)
      .order("appt_date", { ascending: true })
      .order("appt_time", { ascending: true });

    if (error) {
      setMsg(error.message);
      setAppts([]);
      return;
    }

    // ✅ IMPORTANT: only fetch staff that can be assigned (therapist + attendant)
    const { data: stList, error: stErr } = await supabase
      .from("staff")
      .select("id,name,position")
      .in("position", ["massage_therapist", "spa_attendant"])
      .order("name", { ascending: true });

    const { data: rmList, error: rmErr } = await supabase
      .from("rooms")
      .select("id,name")
      .order("name", { ascending: true });

    if (stErr) setMsg((m) => (m ? m + " | " : "") + stErr.message);
    if (rmErr) setMsg((m) => (m ? m + " | " : "") + rmErr.message);

    setAppts((data ?? []) as any);
    setStaff((stList ?? []) as StaffRow[]);
    setRooms((rmList ?? []) as RoomRow[]);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function save(apptId: number, vals: { appt_date: string; appt_time: string; staff_id: number; room_id: number }) {
    setMsg("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return setMsg("Unauthorized (no session token). Logout/login again.");

    const res = await fetch("/api/manager/reschedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ appointmentId: apptId, ...vals }),
    });

    const json = await res.json();
    if (!res.ok) return setMsg(json.error || "Failed to update");

    setMsg("Appointment updated ✅");
    await loadData();
  }

  return (
    <SiteShell>
      <div className="card cardPad">
        <h2 style={{ marginTop: 0 }}>Manager — Reschedule / Reassign</h2>

        {/* ✅ Greeting */}
        <p style={{ marginTop: 6, color: "var(--muted)" }}>
          Good day Manager <b>{managerName}</b> !
        </p>

        <p style={{ color: "var(--muted)" }}>
          Change date, time, therapist, or room per booking.
        </p>

        <button className="btn" onClick={logout}>Logout</button>

        {msg && (
          <div
            className={msg.includes("✅") ? "noticeOk" : "notice"}
            style={{ marginTop: 12 }}
          >
            {msg}
          </div>
        )}
      </div>

      <div className="card cardPad" style={{ marginTop: 14 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th><th>Time</th><th>Customer</th><th>Service</th><th>Therapist</th><th>Room</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {appts.length === 0 ? (
              <tr><td colSpan={7}>No appointments found.</td></tr>
            ) : appts.map((a) => (
              <ManagerRow
                key={a.id}
                appt={a}
                staff={staff}      // ✅ already filtered
                rooms={rooms}
                onSave={(vals) => save(a.id, vals)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </SiteShell>
  );
}

function ManagerRow({
  appt,
  staff,
  rooms,
  onSave,
}: {
  appt: Appt;
  staff: StaffRow[];
  rooms: RoomRow[];
  onSave: (vals: { appt_date: string; appt_time: string; staff_id: number; room_id: number }) => void;
}) {
  const [date, setDate] = useState(appt.appt_date ?? "");
  const [time, setTime] = useState(String(appt.appt_time ?? "").slice(0, 5));
  const [staffId, setStaffId] = useState<number>(appt.staff_id ?? 0);
  const [roomId, setRoomId] = useState<number>(appt.room_id ?? 0);

  // ✅ Extra safety: only allow selecting therapist/attendant
  const allowedStaff = useMemo(() => {
    return staff.filter((s) => {
      const p = String(s.position || "").trim().toLowerCase();
      return p === "massage_therapist" || p === "spa_attendant";
    });
  }, [staff]);

  return (
    <tr>
      <td>
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </td>

      <td>
        <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </td>

      <td>{appt.customer?.full_name ?? "—"}</td>
      <td>{appt.services?.name ?? "—"}</td>

      <td>
        <select value={staffId || ""} onChange={(e) => setStaffId(Number(e.target.value))}>
          <option value="">Select</option>
          {allowedStaff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.position})
            </option>
          ))}
        </select>
      </td>

      <td>
        <select value={roomId || ""} onChange={(e) => setRoomId(Number(e.target.value))}>
          <option value="">Select</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </td>

      <td>
        <button
          className="btn btnPrimary"
          onClick={() => onSave({ appt_date: date, appt_time: time, staff_id: staffId, room_id: roomId })}
        >
          Save
        </button>
      </td>
    </tr>
  );
}