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

  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const mainService = useMemo(
    () => services.find((s) => s.id === serviceId) || null,
    [services, serviceId]
  );

  // ✅ Normalize category (case/space/dash insensitive)
  const norm = (v: string | null | undefined) =>
    (v ?? "")
      .toLowerCase()
      .replace(/[\s_]/g, "")
      .replace(/-+/g, "");

  // ✅ "Add-ons" in DB will still match
  const isAddon = (cat: string | null | undefined) => {
    const c = norm(cat);
    return c.includes("addon"); // addon, addons, spaaddons, add-ons
  };

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

      setAddons(all.filter((x) => isAddon(x.category)));
      setServices(all.filter((x) => !isAddon(x.category)));

      // load staff
      const { data: st, error: stErr } = await supabase
        .from("staff")
        .select("id,name,position")
        .order("name", { ascending: true });

      if (stErr) setMsg(stErr.message);
      setStaff((st ?? []) as StaffRow[]);

      // load rooms
      const { data: rm, error: rmErr } = await supabase
        .from("rooms")
        .select("id,name")
        .order("name", { ascending: true });

      if (rmErr) setMsg(rmErr.message);
      setRooms((rm ?? []) as RoomRow[]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ When service changes, reset staff + add-ons selection
  useEffect(() => {
    setStaffId("");
    setSelectedAddons([]);
  }, [serviceId]);

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

  // ✅ Filter staff based on service category
  const filteredStaff = useMemo(() => {
    if (!mainService) return [];
    const c = (mainService.category ?? "").toLowerCase();

    // Massage services → massage therapists only
    if (c.includes("massage")) {
      return staff.filter((s) => s.position === "massage_therapist");
    }

    // Everything else → spa attendants only
    return staff.filter((s) => s.position === "spa_attendant");
  }, [mainService, staff]);

  async function book() {
    setMsg("");

    if (!serviceId || !staffId || !roomId || !date || !time) {
      setMsg("Please complete all required fields.");
      return;
    }

    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;

    if (!uid) {
      setLoading(false);
      router.push("/login");
      return;
    }

    // ✅ 1) Insert appointment (main service only)
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
      setLoading(false);
      setMsg(insErr?.message || "Failed to book appointment.");
      return;
    }

    const appointmentId = inserted.id as number;

    // ✅ 2) Insert add-ons (if any)
    if (selectedAddons.length > 0) {
      const rows = selectedAddons.map((addonId) => ({
        appointment_id: appointmentId,
        addon_service_id: addonId,
      }));

      const { error: addErr } = await supabase.from("appointment_addons").insert(rows);

      if (addErr) {
        setLoading(false);
        setMsg("Booked, but add-ons failed to save: " + addErr.message);
        return;
      }
    }

    setLoading(false);
    router.push("/dashboard");
  }

  return (
    <SiteShell>
      <div className="card cardPad">
        <h2 style={{ marginTop: 0 }}>Book Appointment</h2>

        {msg && <div className={msg.includes("✅") ? "noticeOk" : "notice"}>{msg}</div>}

        {/* ✅ Service */}
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

        {/* ✅ Add-ons only after selecting a service */}
        {mainService && (
          <div style={{ marginTop: 16 }}>
            <label>
              Add-Ons <span style={{ color: "var(--muted)" }}>(optional)</span>
            </label>

            <div
  className="card"
  style={{
    marginTop: 8,
    padding: "14px 16px",   // ✅ smaller than cardPad
    borderRadius: 16,
    boxShadow: "none"       // ✅ same style as other inner blocks
  }}
>
              {addons.length === 0 ? (
                <p style={{ color: "var(--muted)", margin: 0 }}>No add-ons available.</p>
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

            <p style={{ marginTop: 10, color: "var(--muted)" }}>
              Total estimate: <b>₱{totalPrice}</b>
            </p>
          </div>
        )}

        {/* ✅ Staff: disabled until service chosen */}
        <div style={{ marginTop: 12 }}>
          <label>Staff</label>

          {!mainService && (
            <p style={{ margin: "6px 0 10px", color: "var(--muted)" }}>
              Select a service first to see available staff.
            </p>
          )}

          <select
            value={staffId}
            disabled={!mainService}
            onChange={(e) => setStaffId(e.target.value ? Number(e.target.value) : "")}
            style={{
              opacity: !mainService ? 0.65 : 1,
              cursor: !mainService ? "not-allowed" : "pointer",
            }}
          >
            <option value="">{!mainService ? "Select service first" : "Select staff"}</option>

            {filteredStaff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* ✅ Room */}
        <div style={{ marginTop: 12 }}>
          <label>Room</label>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Select room</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* ✅ Date */}
        <div style={{ marginTop: 12 }}>
          <label>Date</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        {/* ✅ Time */}
        <div style={{ marginTop: 12 }}>
          <label>Time</label>
          <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
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