"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Service = { id: number; name: string; category: string; duration_minutes: number; price: number; video_url?: string | null };
type Staff = { id: number; name: string; position: string };
type Room = { id: number; name: string };

export default function BookPage() {
  const router = useRouter();

  const [msg, setMsg] = useState("");

  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const [serviceId, setServiceId] = useState<string>("");
  const [staffId, setStaffId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");

  const [apptDate, setApptDate] = useState("");
  const [apptTime, setApptTime] = useState("");

  useEffect(() => {
    (async () => {
      setMsg("");

      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.push("/login");
        return;
      }

      const { data: svc, error: sErr } = await supabase
        .from("services")
        .select("id, name, category, duration_minutes, price, video_url")
        .order("category", { ascending: true });

      if (sErr) setMsg(sErr.message);

      const { data: st, error: stErr } = await supabase
        .from("staff")
        .select("id, name, position")
        .order("id", { ascending: true });

      if (stErr) setMsg((m) => (m ? m + " | " : "") + stErr.message);

      const { data: rm, error: rErr } = await supabase
        .from("rooms")
        .select("id, name")
        .order("id", { ascending: true });

      if (rErr) setMsg((m) => (m ? m + " | " : "") + rErr.message);

      setServices((svc ?? []) as Service[]);
      setStaff((st ?? []) as Staff[]);
      setRooms((rm ?? []) as Room[]);
    })();
  }, [router]);

  // ✅ Find selected service
  const selectedService = useMemo(() => {
    const idNum = Number(serviceId);
    return services.find((s) => s.id === idNum) || null;
  }, [serviceId, services]);

  // ✅ Massage vs Non-massage
  const isMassage = (selectedService?.category || "") === "Massage Therapies";

  // ✅ Filter staff based on service category
  const compatibleStaff = useMemo(() => {
    return staff.filter((s) => {
      const pos = String(s.position || "").trim().toLowerCase();
      if (isMassage) return pos === "massage_therapist";
      return pos === "spa_attendant";
    });
  }, [staff, isMassage]);

  // ✅ Reset selected staff when service changes (prevents wrong staff)
  useEffect(() => {
    setStaffId("");
  }, [serviceId]);

  async function bookNow() {
    setMsg("");

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      router.push("/login");
      return;
    }

    if (!serviceId || !staffId || !roomId || !apptDate || !apptTime) {
      setMsg("Please complete all fields.");
      return;
    }

    // use duration from selected service
    const duration = selectedService?.duration_minutes ?? 60;

    const { error } = await supabase.from("appointments").insert({
      user_id: auth.user.id,
      service_id: Number(serviceId),
      staff_id: Number(staffId),
      room_id: Number(roomId),
      appt_date: apptDate,
      appt_time: apptTime,
      duration_minutes: duration,
      status: "scheduled",
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Booked successfully ✅");
  }

  return (
    <main style={{ maxWidth: 800, margin: "40px auto", fontFamily: "Arial" }}>
      <h2>Book Appointment</h2>
      {msg && <p style={{ color: msg.includes("✅") ? "green" : "crimson" }}>{msg}</p>}

      {/* Service */}
      <label>Service</label>
      <select
        style={{ width: "100%", padding: 10, margin: "6px 0 14px" }}
        value={serviceId}
        onChange={(e) => setServiceId(e.target.value)}
      >
        <option value="">Select service</option>
        {services.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} — ₱{s.price} ({s.category})
          </option>
        ))}
      </select>

      {/* Show rule */}
      {selectedService && (
        <p style={{ color: "#666", marginTop: -6, marginBottom: 14 }}>
          Staff required: <b>{isMassage ? "Massage Therapist" : "Spa Attendant"}</b>
        </p>
      )}

      {/* Staff (filtered) */}
      <label>Staff</label>
      <select
        style={{ width: "100%", padding: 10, margin: "6px 0 14px" }}
        value={staffId}
        onChange={(e) => setStaffId(e.target.value)}
        disabled={!serviceId}
      >
        <option value="">{serviceId ? "Select staff" : "Select service first"}</option>
        {compatibleStaff.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      {/* Room */}
      <label>Room</label>
      <select
        style={{ width: "100%", padding: 10, margin: "6px 0 14px" }}
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      >
        <option value="">Select room</option>
        {rooms.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>

      {/* Date/Time */}
      <label>Date</label>
      <input
        type="date"
        style={{ width: "100%", padding: 10, margin: "6px 0 14px" }}
        value={apptDate}
        onChange={(e) => setApptDate(e.target.value)}
      />

      <label>Time</label>
      <input
        type="time"
        style={{ width: "100%", padding: 10, margin: "6px 0 18px" }}
        value={apptTime}
        onChange={(e) => setApptTime(e.target.value)}
      />

      <button onClick={bookNow} style={{ padding: "10px 14px" }}>
        Book Now
      </button>
    </main>
  );
}