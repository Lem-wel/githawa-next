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

type StaffRow = { id: number; name: string; position: string };
type RoomRow = { id: number; name: string };

export default function BookPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("");

  const [services, setServices] = useState<Service[]>([]);
  const [addons, setAddons] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [rooms, setRooms] = useState<RoomRow[]>([]);

  const [serviceId, setServiceId] = useState<number | "">("");
  const [staffId, setStaffId] = useState<number | "">("");
  const [roomId, setRoomId] = useState<number | "">("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // ✅ selected add-ons
  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);

  const mainService = useMemo(
    () => services.find((s) => s.id === serviceId) || null,
    [services, serviceId]
  );

  useEffect(() => {
    (async () => {
      setMsg("");

      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return router.push("/login");

      // load services
      const { data: svc, error: sErr } = await supabase
        .from("services")
        .select("id,name,description,duration_minutes,price,category")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (sErr) setMsg(sErr.message);

      const all = (svc ?? []) as Service[];

      // ✅ split: main services vs addons
      setAddons(all.filter((x) => (x.category || "").toLowerCase() === "Add-ons"));
      setServices(all.filter((x) => (x.category || "").toLowerCase() !== "Add-ons"));

      // load staff (your logic may be different — keep whatever you already have)
      const { data: st } = await supabase
        .from("staff")
        .select("id,name,position")
        .order("name", { ascending: true });

      setStaff((st ?? []) as StaffRow[]);

      // load rooms
      const { data: rm } = await supabase
        .from("rooms")
        .select("id,name")
        .order("name", { ascending: true });

      setRooms((rm ?? []) as RoomRow[]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleAddon(addonId: number) {
    setSelectedAddons((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  }

  const addonsTotal = useMemo(() => {
    const map = new Map(addons.map((a) => [a.id, a.price]));
    return selectedAddons.reduce((sum, id) => sum + (map.get(id) ?? 0), 0);
  }, [addons, selectedAddons]);

  const totalPrice = useMemo(() => {
    return (mainService?.price ?? 0) + addonsTotal;
  }, [mainService, addonsTotal]);

  async function book() {
    setMsg("");

    if (!serviceId || !staffId || !roomId || !date || !time) {
      setMsg("Please complete all required fields.");
      return;
    }

    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return router.push("/login");

    // ✅ 1) insert appointment (main service only)
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
          duration_minutes: mainService?.duration_minutes ?? 60,
        },
      ])
      .select("id")
      .single();

    if (insErr || !inserted) {
      setMsg(insErr?.message || "Failed to book appointment.");
      return;
    }

    const appointmentId = inserted.id as number;

    // ✅ 2) insert selected add-ons
    if (selectedAddons.length > 0) {
      const rows = selectedAddons.map((addonId) => ({
        appointment_id: appointmentId,
        addon_service_id: addonId,
      }));

      const { error: addErr } = await supabase.from("appointment_addons").insert(rows);
      if (addErr) {
        setMsg("Booked, but add-ons failed to save: " + addErr.message);
        return;
      }
    }

    setMsg("Appointment booked ✅");
    // reset optional
    setSelectedAddons([]);
    router.push("/dashboard");
  }

  return (
    <SiteShell>
      <div className="card cardPad">
        <h2 style={{ marginTop: 0 }}>Book Appointment</h2>

        {msg && <div className={msg.includes("✅") ? "noticeOk" : "notice"}>{msg}</div>}

        <div style={{ marginTop: 12 }}>
          <label>Service</label>
          <select value={serviceId} onChange={(e) => setServiceId(e.target.value ? Number(e.target.value) : "")}>
            <option value="">Select service</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — ₱{s.price} ({s.category || "service"})
              </option>
            ))}
          </select>
        </div>

        {/* ✅ Add-ons section */}
        <div style={{ marginTop: 16 }}>
          <label>
            Add-Ons <span style={{ color: "var(--muted)" }}>(optional)</span>
          </label>

          <div className="card cardPad" style={{ marginTop: 8 }}>
            {addons.length === 0 ? (
              <p style={{ color: "var(--muted)", margin: 0 }}>No add-ons yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {addons.map((a) => {
                  const checked = selectedAddons.includes(a.id);
                  return (
                    <label key={a.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAddon(a.id)}
                        style={{ width: 18, height: 18 }}
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

          {/* ✅ live total */}
          <p style={{ marginTop: 10, color: "var(--muted)" }}>
            Total estimate: <b>₱{totalPrice}</b>
          </p>
        </div>

        <div style={{ marginTop: 12 }}>
  <label>Staff</label>

  <select
    value={staffId}
    onChange={(e) => setStaffId(e.target.value ? Number(e.target.value) : "")}
  >
    <option value="">Select staff</option>

    {staff
      .filter((s) => {
        if (!mainService) return true;

        const category = mainService.category?.toLowerCase();

        if (category === "massage")
          return s.position === "massage_therapist";

        return s.position === "spa_attendant";
      })
      .map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
  </select>
</div>

        <div style={{ marginTop: 12 }}>
          <label>Room</label>
          <select value={roomId} onChange={(e) => setRoomId(e.target.value ? Number(e.target.value) : "")}>
            <option value="">Select room</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Date</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Time</label>
          <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>

        <div style={{ marginTop: 16 }}>
          <button className="btn btnPrimary" onClick={book}>
            Book Now
          </button>
        </div>
      </div>
    </SiteShell>
  );
}