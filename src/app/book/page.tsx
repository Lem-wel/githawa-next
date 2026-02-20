"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Service = { id: number; name: string; duration_minutes: number };
type Room = { id: number; name: string };
type Staff = { id: number; name: string };

export default function BookPage() {
  const router = useRouter();

  const [services, setServices] = useState<Service[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [msg, setMsg] = useState("");

  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [roomId, setRoomId] = useState("");
  const [staffId, setStaffId] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: s } = await supabase.from("services").select("*");
    const { data: r } = await supabase.from("rooms").select("*");
    const { data: st } = await supabase.from("staff").select("*");

    setServices(s ?? []);
    setRooms(r ?? []);
    setStaff(st ?? []);
  }
  async function awardBadges(userId: string) {
  // Count total appointments for this user
  const { data: appts, error: apptErr } = await supabase
    .from("appointments")
    .select("id")
    .eq("user_id", userId);

  if (apptErr) {
    console.error("Badge check error:", apptErr.message);
    return;
  }

  const count = appts?.length ?? 0;

  // Helper: award a badge by code
  async function give(code: string) {
    const { data: badge, error: badgeErr } = await supabase
      .from("badges")
      .select("id")
      .eq("code", code)
      .single();

    if (badgeErr || !badge?.id) {
      console.error("Badge not found:", code, badgeErr?.message);
      return;
    }

    // Insert if not already earned (unique constraint handles duplicates)
    const { error: earnErr } = await supabase.from("user_badges").upsert(
      { user_id: userId, badge_id: badge.id },
      { onConflict: "user_id,badge_id" }
    );

    if (earnErr) console.error("Earn badge error:", earnErr.message);
  }

  // Badge rules
  if (count >= 2) await give("BOOKED_2_TOTAL");
  if (count >= 2) await give("BOOKED_2_IN_A_ROW"); // simple streak version
}

  async function book() {
    setMsg("");

    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;

    if (!user) {
      router.push("/login");
      return;
    }

    if (!serviceId || !date || !time || !roomId || !staffId) {
      setMsg("Please complete all fields");
      return;
    }
    

    // get selected service duration
    const service = services.find(s => s.id === Number(serviceId));
    const duration = service?.duration_minutes ?? 60;

    // check conflict
    const { data: existing } = await supabase
      .from("appointments")
      .select("appt_time, duration_minutes")
      .eq("appt_date", date)
      .or(`room_id.eq.${roomId},staff_id.eq.${staffId}`);

    function toMinutes(t: string) {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    }

    const newStart = toMinutes(time);

    for (const e of existing ?? []) {
      const oldStart = toMinutes(String(e.appt_time).slice(0,5));
      const oldEnd = oldStart + e.duration_minutes;
      const newEnd = newStart + duration;

      if (newStart < oldEnd && oldStart < newEnd) {
        setMsg("Conflict: room or staff already booked at this time.");
        return;
      }
    }

    // insert appointment
    const { error } = await supabase.from("appointments").insert({
      user_id: user.id,
      service_id: Number(serviceId),
      appt_date: date,
      appt_time: time,
      duration_minutes: duration,
      room_id: Number(roomId),
      staff_id: Number(staffId),
    });

    if (error) {
      setMsg(error.message);
      return;
      
    }
    await awardBadges(user.id);
setMsg("Appointment booked successfully! Badges updated ✅");

    setMsg("Appointment booked successfully!");
  }
  

  return (
    <main style={{ maxWidth: 700, margin: "40px auto", fontFamily: "Arial" }}>
      <h2>Book Appointment</h2>

      {msg && <p style={{ color: msg.includes("success") ? "green" : "crimson" }}>{msg}</p>}

      <label>Service</label>
      <select value={serviceId} onChange={e=>setServiceId(e.target.value)}>
        <option value="">Select</option>
        {services.map(s=>(
          <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes}min)</option>
        ))}
      </select>

      <label>Date</label>
      <input type="date" value={date} onChange={e=>setDate(e.target.value)} />

      <label>Time</label>
      <input type="time" value={time} onChange={e=>setTime(e.target.value)} />

      <label>Room</label>
      <select value={roomId} onChange={e=>setRoomId(e.target.value)}>
        <option value="">Select</option>
        {rooms.map(r=>(
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>

      <label>Staff</label>
      <select value={staffId} onChange={e=>setStaffId(e.target.value)}>
        <option value="">Select</option>
        {staff.map(s=>(
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>

      <div style={{ marginTop: 20 }}>
        <button onClick={book}>Book</button>
      </div>
    </main>
  );
  
}
