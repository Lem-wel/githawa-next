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
  services?: { name?: string; category?: string | null } | null;
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

const OPEN_MINUTES = 8 * 60;
const CLOSE_MINUTES = 17 * 60;
const SLOT_INTERVAL = 15;

function isMassageCategory(category: string | null | undefined) {
  return String(category ?? "").toLowerCase().includes("massage");
}

function normalizeCategory(category: string | null | undefined) {
  return String(category ?? "").trim().toLowerCase();
}

function getWarmCategoryTextColor(category: string | null | undefined) {
  const cat = normalizeCategory(category);
  if (cat.includes("massage")) return "#9b5a2e";
  if (cat.includes("facial")) return "#b86b4f";
  if (cat.includes("body") || cat.includes("scrub") || cat.includes("wrap")) return "#a15a43";
  if (cat.includes("addon")) return "#8b6a3d";
  return "#7e5a36";
}

function getWarmCategoryBadgeStyle(category: string | null | undefined) {
  const cat = normalizeCategory(category);

  if (cat.includes("massage")) {
    return { color: "#7f431d", background: "#f8e7d8", border: "1px solid #e2bea0" };
  }

  if (cat.includes("facial")) {
    return { color: "#8f4a36", background: "#fae6df", border: "1px solid #e8b9ac" };
  }

  if (cat.includes("body") || cat.includes("scrub") || cat.includes("wrap")) {
    return { color: "#7f4331", background: "#f7e1da", border: "1px solid #dfb1a4" };
  }

  if (cat.includes("addon")) {
    return { color: "#70542d", background: "#f7ecd8", border: "1px solid #e1c79b" };
  }

  return { color: "#6d5030", background: "#f3e6d8", border: "1px solid #dcc3a7" };
}

function toLocalDateTime(date: string, time: string) {
  if (!date || !time) return null;
  const safeTime = String(time).slice(0, 5);
  const dt = new Date(`${date}T${safeTime}:00`);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function timeToMinutes(t: string) {
  const [h, m] = t.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

function minutesToTimeValue(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatTimeLabel(total: number) {
  const hour24 = Math.floor(total / 60);
  const minute = total % 60;
  const displayHour = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const ampm = hour24 < 12 ? "AM" : "PM";
  return `${displayHour}:${String(minute).padStart(2, "0")} ${ampm}`;
}

export default function ManagerPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [appts, setAppts] = useState<Appt[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [managerName, setManagerName] = useState("Manager");
  const [isAdmin, setIsAdmin] = useState(false);

  const visibleAppts = useMemo(() => {
    if (!selectedDate) return appts;
    return appts.filter((a) => a.appt_date === selectedDate);
  }, [appts, selectedDate]);

  useEffect(() => {
    (async () => {
      setMsg("");

      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.push("/login");
        return;
      }

      const { data: prof, error: pErr } = await supabase
        .from("profiles")
        .select("role, staff_id, full_name")
        .eq("id", auth.user.id)
        .single();

      if (pErr || !prof) {
        router.push("/dashboard");
        return;
      }

      const adminMode = prof.role === "admin";
      setIsAdmin(adminMode);

      if (!adminMode && (prof.role !== "staff" || !prof.staff_id)) {
        router.push("/dashboard");
        return;
      }

      if (adminMode) {
        setManagerName(prof.full_name || "Admin");
        await loadData();
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
  }, [router]);

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
        services(name, category),
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

  async function save(
    apptId: number,
    vals: { appt_date: string; appt_time: string; staff_id: number; room_id: number }
  ) {
    setMsg("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setMsg("Unauthorized (no session token). Logout/login again.");
      return;
    }

    const res = await fetch("/api/manager/reschedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ appointmentId: apptId, ...vals }),
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
    <SiteShell>
      <div className="card cardPad">
        <h2 style={{ marginTop: 0 }}>Manager — Reschedule / Reassign</h2>

        <p style={{ marginTop: 6, color: "var(--muted)" }}>
          Good day {isAdmin ? "" : "Manager"} <b>{managerName}</b> !
        </p>

        <p style={{ color: "var(--muted)" }}>
          Change date, time, therapist, or room per booking.
        </p>

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
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <label htmlFor="manager-day-filter" style={{ fontWeight: 700 }}>
            Calendar:
          </label>
          <input
            id="manager-day-filter"
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
              <th>Customer</th>
              <th>Service</th>
              <th>Therapist</th>
              <th>Room</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleAppts.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  {selectedDate
                    ? "No appointments found for this day."
                    : "No appointments found."}
                </td>
              </tr>
            ) : (
              visibleAppts.map((a) => (
                <ManagerRow
                  key={a.id}
                  appt={a}
                  staff={staff}
                  rooms={rooms}
                  onSave={(vals) => save(a.id, vals)}
                />
              ))
            )}
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
  const [staffId, setStaffId] = useState<string>(appt.staff_id ? String(appt.staff_id) : "");
  const [roomId, setRoomId] = useState<string>(appt.room_id ? String(appt.room_id) : "");

  const isPast = useMemo(() => {
    const apptDateTime = toLocalDateTime(appt.appt_date, String(appt.appt_time ?? ""));
    if (!apptDateTime) return false;
    return apptDateTime.getTime() < Date.now();
  }, [appt.appt_date, appt.appt_time]);

  const allowedStaff = useMemo(() => {
    const serviceCat = appt.services?.category ?? null;
    const needsMassageTherapist = isMassageCategory(serviceCat);

    return staff.filter((s) => {
      const p = String(s.position || "").trim().toLowerCase();
      if (needsMassageTherapist) return p === "massage_therapist";
      return p === "spa_attendant";
    });
  }, [staff, appt.services?.category]);

  const serviceDuration = useMemo(() => {
    const val = appt.duration_minutes ?? 0;
    return val > 0 ? val : 60;
  }, [appt.duration_minutes]);

  const timeSlots = useMemo(() => {
    const slots: { value: string; label: string }[] = [];

    for (let t = OPEN_MINUTES; t <= CLOSE_MINUTES; t += SLOT_INTERVAL) {
      const end = t + serviceDuration;
      if (end <= CLOSE_MINUTES) {
        slots.push({
          value: minutesToTimeValue(t),
          label: `${formatTimeLabel(t)} - ${formatTimeLabel(end)}`,
        });
      }
    }

    if (time && !slots.some((slot) => slot.value === time)) {
      const startMins = timeToMinutes(time);
      slots.unshift({
        value: time,
        label: `${formatTimeLabel(startMins)} - ${formatTimeLabel(startMins + serviceDuration)}`,
      });
    }

    return slots;
  }, [time, serviceDuration]);

  const canSave = Boolean(date && time && staffId && roomId && !isPast);

  return (
    <tr style={isPast ? { opacity: 0.7 } : undefined}>
      <td>
        <input
          className="input"
          type="date"
          value={date}
          disabled={isPast}
          onChange={(e) => setDate(e.target.value)}
        />
      </td>

      <td>
        <select
          className="input"
          value={time}
          disabled={isPast}
          onChange={(e) => setTime(e.target.value)}
        >
          <option value="">Select time</option>
          {timeSlots.map((slot) => (
            <option key={slot.value} value={slot.value}>
              {slot.label}
            </option>
          ))}
        </select>
      </td>

      <td>{appt.customer?.full_name ?? "—"}</td>

      <td>
        {appt.services?.name ?? "—"}
        <div
          style={{
            color: getWarmCategoryTextColor(appt.services?.category),
            fontSize: 12,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            marginTop: 4,
            padding: "2px 8px",
            borderRadius: 999,
            ...getWarmCategoryBadgeStyle(appt.services?.category),
          }}
        >
          {appt.services?.category ?? ""}
        </div>
      </td>

      <td>
        <select
          value={staffId}
          disabled={isPast}
          onChange={(e) => setStaffId(e.target.value)}
        >
          <option value="">Select</option>
          {allowedStaff.map((s) => (
            <option key={s.id} value={String(s.id)}>
              {s.name} ({s.position})
            </option>
          ))}
        </select>
      </td>

      <td>
        <select
          value={roomId}
          disabled={isPast}
          onChange={(e) => setRoomId(e.target.value)}
        >
          <option value="">Select</option>
          {rooms.map((r) => (
            <option key={r.id} value={String(r.id)}>
              {r.name}
            </option>
          ))}
        </select>
      </td>

      <td>
        {isPast ? (
          <span
            style={{
              display: "inline-block",
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              background: "#e8f7ec",
              color: "#18794e",
            }}
          >
            Done
          </span>
        ) : (
          <button
            className="btn btnPrimary"
            disabled={!canSave}
            onClick={() =>
              onSave({
                appt_date: date,
                appt_time: time,
                staff_id: Number(staffId),
                room_id: Number(roomId),
              })
            }
          >
            Save
          </button>
        )}
      </td>
    </tr>
  );
}