"use client";

import { useEffect, useMemo, useState } from "react";
import SiteShell from "@/components/SiteShell";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Service = { id: number; name: string; category: string; duration_minutes: number; price: number; video_url?: string | null };
type Staff = { id: number; name: string; position: string };
type Room = { id: number; name: string };

export default function BookPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("");

  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [apptDate, setApptDate] = useState("");
  const [apptTime, setApptTime] = useState("");

  useEffect(() => {
    (async () => {
      setMsg("");
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return router.push("/login");

      const { data: svc, error: sErr } = await supabase
        .from("services")
        .select("id,name,category,duration_minutes,price,video_url")
        .order("category", { ascending: true })
        .order("name", { ascending: true });
      if (sErr) setMsg(sErr.message);

      const { data: st, error: stErr } = await supabase
        .from("staff")
        .select("id,name,position")
        .order("id", { ascending: true });
      if (stErr) setMsg((m) => (m ? m + " | " : "") + stErr.message);

      const { data: rm, error: rErr } = await supabase
        .from("rooms")
        .select("id,name")
        .order("id", { ascending: true });
      if (rErr) setMsg((m) => (m ? m + " | " : "") + rErr.message);

      setServices((svc ?? []) as Service[]);
      setStaff((st ?? []) as Staff[]);
      setRooms((rm ?? []) as Room[]);
    })();
  }, [router]);

  const selectedService = useMemo(() => {
    const idNum = Number(serviceId);
    return services.find((s) => s.id === idNum) || null;
  }, [serviceId, services]);

  const isMassage = (selectedService?.category || "") === "Massage Therapies";

  const compatibleStaff = useMemo(() => {
    return staff.filter((s) => {
      const pos = String(s.position || "").trim().toLowerCase();
      if (isMassage) return pos === "massage_therapist";
      return pos === "spa_attendant";
    });
  }, [staff, isMassage]);

  useEffect(() => {
    setStaffId("");
  }, [serviceId]);

  async function bookNow() {
    setMsg("");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return router.push("/login");

    if (!serviceId || !staffId || !roomId || !apptDate || !apptTime) {
      setMsg("Please complete all fields.");
      return;
    }

    const duration = selectedService?.duration_minutes ?? 60;

    const { error } = await supabase.from("appointments").insert({
      user_id: auth.user.id,
      service_id: Number(serviceId),
      staff_id: Number(staffId),
      room_id: Number(roomId),
      appt_date: apptDate,
      appt_time: apptTime,
      duration_minutes: duration,
    });

    if (error) return setMsg(error.message);

    setMsg("Booked successfully ✅");
  }

  return (
    <SiteShell right={<Link className="btn" href="/dashboard">Dashboard</Link>}>
      <div className="card cardPad" style={{ maxWidth: 860 }}>
        <h2 style={{ marginTop: 0 }}>Book Appointment</h2>
        {msg && <div className={msg.includes("✅") ? "noticeOk" : "notice"} style={{ marginBottom: 12 }}>{msg}</div>}

        <label>Service</label>
        <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
          <option value="">Select service</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — ₱{s.price} ({s.category})
            </option>
          ))}
        </select>

        {selectedService && (
          <p style={{ marginTop: 10, color: "var(--muted)" }}>
            Staff required: <b>{isMassage ? "Massage Therapist" : "Spa Attendant"}</b>
          </p>
        )}

        <div className="formRow" style={{ marginTop: 10 }}>
          <div>
            <label>Staff</label>
            <select value={staffId} onChange={(e) => setStaffId(e.target.value)} disabled={!serviceId}>
              <option value="">{serviceId ? "Select staff" : "Select service first"}</option>
              {compatibleStaff.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Room</label>
            <select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
              <option value="">Select room</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="formRow" style={{ marginTop: 10 }}>
          <div>
            <label>Date</label>
            <input className="input" type="date" value={apptDate} onChange={(e) => setApptDate(e.target.value)} />
          </div>
          <div>
            <label>Time</label>
            <input className="input" type="time" value={apptTime} onChange={(e) => setApptTime(e.target.value)} />
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <button className="btn btnPrimary" onClick={bookNow}>Book Now</button>
        </div>
      </div>
    </SiteShell>
  );
}