"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import SiteShell from "@/components/SiteShell";

type Service = {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  category: string | null;
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

type ExistingAppointment = {
  id: number;
  staff_id: number | null;
  room_id: number | null;
  appt_date: string;
  appt_time: string;
  duration_minutes: number | null;
};

export default function BookPage() {
  const router = useRouter();

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [services, setServices] = useState<Service[]>([]);
  const [addons, setAddons] = useState<Service[]>([]);
  const [allStaff, setAllStaff] = useState<StaffRow[]>([]);
  const [allRooms, setAllRooms] = useState<RoomRow[]>([]);

  const [serviceId, setServiceId] = useState<number | "">("");
  const [staffId, setStaffId] = useState<number | "">("");
  const [roomId, setRoomId] = useState<number | "">("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);
  const [availableStaff, setAvailableStaff] = useState<StaffRow[]>([]);
  const [availableRooms, setAvailableRooms] = useState<RoomRow[]>([]);

  const mainService = useMemo(
    () => services.find((s) => s.id === serviceId) || null,
    [services, serviceId]
  );

  const timeSlots = useMemo(() => {
    const slots: { value: string; label: string }[] = [];
    const start = 8 * 60; // 8:00 AM
    const end = 17 * 60; // 5:00 PM

    for (let t = start; t <= end; t += 15) {
      const hour24 = Math.floor(t / 60);
      const minute = t % 60;

      const value = `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

      const displayHour = hour24 % 12 === 0 ? 12 : hour24 % 12;
      const ampm = hour24 < 12 ? "AM" : "PM";
      const label = `${displayHour}:${String(minute).padStart(2, "0")} ${ampm}`;

      slots.push({ value, label });
    }

    return slots;
  }, []);

  function norm(v: string | null | undefined) {
    return (v ?? "")
      .toLowerCase()
      .replace(/[\s_]/g, "")
      .replace(/-+/g, "");
  }

  function isAddon(cat: string | null | undefined) {
    return norm(cat).includes("addon");
  }

  function toggleAddon(addonId: number) {
    setSelectedAddons((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    );
  }

  const selectedAddonRows = useMemo(
    () => addons.filter((a) => selectedAddons.includes(a.id)),
    [addons, selectedAddons]
  );

  const totalDuration = useMemo(() => {
    const main = mainService?.duration_minutes ?? 0;
    const addonDur = selectedAddonRows.reduce(
      (sum, a) => sum + (a.duration_minutes ?? 0),
      0
    );
    return main + addonDur;
  }, [mainService, selectedAddonRows]);

  const totalPrice = useMemo(() => {
    const main = mainService?.price ?? 0;
    const addonPrice = selectedAddonRows.reduce((sum, a) => sum + (a.price ?? 0), 0);
    return main + addonPrice;
  }, [mainService, selectedAddonRows]);

  const candidateStaff = useMemo(() => {
    if (!mainService) return [];

    const category = (mainService.category ?? "").toLowerCase();

    if (category.includes("massage")) {
      return allStaff.filter((s) => s.position === "massage_therapist");
    }

    return allStaff.filter((s) => s.position === "spa_attendant");
  }, [mainService, allStaff]);

  useEffect(() => {
    async function init() {
      setMsg("");

      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.push("/login");
        return;
      }

      const { data: svc, error: svcErr } = await supabase
        .from("services")
        .select("id,name,description,duration_minutes,price,category")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (svcErr) {
        setMsg(svcErr.message);
        return;
      }

      const all = (svc ?? []) as Service[];
      setAddons(all.filter((x) => isAddon(x.category)));
      setServices(all.filter((x) => !isAddon(x.category)));

      const { data: st, error: stErr } = await supabase
        .from("staff")
        .select("id,name,position")
        .order("name", { ascending: true });

      if (stErr) {
        setMsg(stErr.message);
        return;
      }
      setAllStaff((st ?? []) as StaffRow[]);

      const { data: rm, error: rmErr } = await supabase
        .from("rooms")
        .select("id,name")
        .order("name", { ascending: true });

      if (rmErr) {
        setMsg(rmErr.message);
        return;
      }
      setAllRooms((rm ?? []) as RoomRow[]);
    }

    init();
  }, [router]);

  useEffect(() => {
    setStaffId("");
    setRoomId("");
  }, [serviceId]);

  useEffect(() => {
    setStaffId("");
    setRoomId("");
  }, [date, time, selectedAddons.length]);

  function timeToMinutes(t: string) {
    const [h, m] = t.slice(0, 5).split(":").map(Number);
    return h * 60 + m;
  }

  function overlaps(startA: number, durA: number, startB: number, durB: number) {
    const endA = startA + durA;
    const endB = startB + durB;
    return startA < endB && startB < endA;
  }

  useEffect(() => {
    async function checkAvailability() {
      setAvailableStaff([]);
      setAvailableRooms([]);

      if (!mainService || !date || !time || totalDuration <= 0) return;

      const { data: existing, error } = await supabase
        .from("appointments")
        .select("id,staff_id,room_id,appt_date,appt_time,duration_minutes")
        .eq("appt_date", date);

      if (error) {
        setMsg(error.message);
        return;
      }

      const rows = (existing ?? []) as ExistingAppointment[];
      const start = timeToMinutes(time);

      const freeStaff = candidateStaff.filter((staff) => {
        const staffAppointments = rows.filter((r) => r.staff_id === staff.id);

        if (staffAppointments.length >= 8) return false;

        const hasOverlap = staffAppointments.some((r) =>
          overlaps(
            start,
            totalDuration,
            timeToMinutes(String(r.appt_time).slice(0, 5)),
            r.duration_minutes ?? 0
          )
        );

        return !hasOverlap;
      });

      const freeRooms = allRooms.filter((room) => {
        const roomAppointments = rows.filter((r) => r.room_id === room.id);

        const hasOverlap = roomAppointments.some((r) =>
          overlaps(
            start,
            totalDuration,
            timeToMinutes(String(r.appt_time).slice(0, 5)),
            r.duration_minutes ?? 0
          )
        );

        return !hasOverlap;
      });

      setAvailableStaff(freeStaff);
      setAvailableRooms(freeRooms);

      if (staffId && !freeStaff.some((s) => s.id === staffId)) setStaffId("");
      if (roomId && !freeRooms.some((r) => r.id === roomId)) setRoomId("");
    }

    checkAvailability();
  }, [mainService, date, time, totalDuration, candidateStaff, allRooms, staffId, roomId]);

  async function book() {
    setMsg("");

    if (!serviceId || !date || !time || !staffId || !roomId) {
      setMsg("Please complete all required fields.");
      return;
    }

    if (!mainService) {
      setMsg("Please select a service.");
      return;
    }

    setLoading(true);

    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;

      if (!uid) {
        router.push("/login");
        return;
      }

      const { data: existing, error: existingErr } = await supabase
        .from("appointments")
        .select("id,staff_id,room_id,appt_date,appt_time,duration_minutes")
        .eq("appt_date", date);

      if (existingErr) {
        setMsg(existingErr.message);
        return;
      }

      const rows = (existing ?? []) as ExistingAppointment[];
      const start = timeToMinutes(time);

      const staffAppointments = rows.filter((r) => r.staff_id === Number(staffId));
      const roomAppointments = rows.filter((r) => r.room_id === Number(roomId));

      if (staffAppointments.length >= 8) {
        setMsg("This staff member already reached the daily booking limit.");
        return;
      }

      const staffConflict = staffAppointments.some((r) =>
        overlaps(
          start,
          totalDuration,
          timeToMinutes(String(r.appt_time).slice(0, 5)),
          r.duration_minutes ?? 0
        )
      );

      if (staffConflict) {
        setMsg("Selected staff is not available at that time.");
        return;
      }

      const roomConflict = roomAppointments.some((r) =>
        overlaps(
          start,
          totalDuration,
          timeToMinutes(String(r.appt_time).slice(0, 5)),
          r.duration_minutes ?? 0
        )
      );

      if (roomConflict) {
        setMsg("Selected room is occupied at that time. Please choose another room.");
        return;
      }

      const { data: inserted, error: insErr } = await supabase
        .from("appointments")
        .insert([
          {
            user_id: uid,
            service_id: Number(serviceId),
            staff_id: Number(staffId),
            room_id: Number(roomId),
            appt_date: date,
            appt_time: time,
            duration_minutes: totalDuration,
          },
        ])
        .select("id")
        .single();

      if (insErr || !inserted) {
        setMsg(insErr?.message || "Failed to book appointment.");
        return;
      }

      const appointmentId = inserted.id as number;

      if (selectedAddons.length > 0) {
        const rowsToInsert = selectedAddons.map((addonId) => ({
          appointment_id: appointmentId,
          addon_service_id: addonId,
        }));

        const { error: addonErr } = await supabase
          .from("appointment_addons")
          .insert(rowsToInsert);

        if (addonErr) {
          setMsg("Booked, but add-ons failed to save: " + addonErr.message);
          return;
        }
      }

      setMsg("Appointment booked successfully ✅");
      setTimeout(() => {
        router.push("/dashboard");
      }, 800);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteShell>
      <div className="card cardPad">
        <h2 style={{ marginTop: 0 }}>Book Appointment</h2>

        {msg && (
          <div className={msg.includes("✅") ? "noticeOk" : "notice"} style={{ marginBottom: 12 }}>
            {msg}
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <label>Service</label>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Select service</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — ₱{s.price} ({s.category || "service"})
              </option>
            ))}
          </select>
        </div>

        {mainService && (
          <div style={{ marginTop: 16 }}>
            <label>
              Add-Ons <span style={{ color: "var(--muted)" }}>(optional)</span>
            </label>

            <div
              className="card"
              style={{
                marginTop: 8,
                padding: "14px 16px",
                borderRadius: 16,
                boxShadow: "none",
              }}
            >
              {addons.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>No add-ons available.</p>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {addons.map((a) => {
                    const checked = selectedAddons.includes(a.id);
                    return (
                      <label
                        key={a.id}
                        style={{ display: "flex", gap: 10, alignItems: "center" }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAddon(a.id)}
                          style={{ width: 16, height: 16 }}
                        />
                        <div style={{ flex: 1 }}>
                          <b>{a.name}</b>{" "}
                          <span style={{ color: "var(--muted)" }}>
                            — ₱{a.price} • {a.duration_minutes} mins
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <p style={{ marginTop: 10, color: "var(--muted)" }}>
              Total estimate: <b>₱{totalPrice}</b>
            </p>
            <p style={{ marginTop: 4, color: "var(--muted)" }}>
              Total duration: <b>{totalDuration} mins</b>
            </p>
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <label>Date</label>
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Time</label>
          <select
            className="input"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          >
            <option value="">Select time</option>
            {timeSlots.map((slot) => (
              <option key={slot.value} value={slot.value}>
                {slot.label}
              </option>
            ))}
          </select>
          <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
            Available booking hours: 8:00 AM to 5:00 PM, every 15 minutes.
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Staff</label>
          <select
            value={staffId}
            disabled={!mainService || !date || !time}
            onChange={(e) => setStaffId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">
              {!mainService || !date || !time
                ? "Select service, date, and time first"
                : availableStaff.length === 0
                ? "No available staff"
                : "Select staff"}
            </option>
            {availableStaff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
            Staff can only be booked up to 8 appointments per day.
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Room</label>
          <select
            value={roomId}
            disabled={!mainService || !date || !time}
            onChange={(e) => setRoomId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">
              {!mainService || !date || !time
                ? "Select service, date, and time first"
                : availableRooms.length === 0
                ? "No available room"
                : "Select room"}
            </option>
            {availableRooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
            Rooms already occupied at the selected time are hidden automatically.
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <button className="btn btnPrimary" onClick={book} disabled={loading}>
            {loading ? "Booking..." : "Book Now"}
          </button>
        </div>
      </div>
    </SiteShell>
  );
}