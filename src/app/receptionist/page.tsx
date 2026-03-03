"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Row = {
  id: number;
  appt_time: string;
  duration_minutes: number;
  service_name: string | null;
  category: string | null;
  room_name: string | null;
  customer_name: string | null;
  staff_id: number | null;
  staff_name: string | null;
  staff_position: string | null;
  therapist_email: string | null;
};

export default function ReceptionistPage() {
  const router = useRouter();

  const [msg, setMsg] = useState("");
  const [name, setName] = useState("");
  const [rows, setRows] = useState<Row[]>([]);

  const today = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  useEffect(() => {
    (async () => {
      setMsg("");

      // 1️⃣ Must be logged in
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.push("/login");
        return;
      }

      // 2️⃣ Load profile
      const { data: prof, error: pErr } = await supabase
        .from("profiles")
        .select("role, staff_id, full_name")
        .eq("id", auth.user.id)
        .single();

      if (pErr || !prof) {
        setMsg("Profile not found.");
        return;
      }

      if (prof.role !== "staff" || !prof.staff_id) {
        router.push("/dashboard");
        return;
      }

      // 3️⃣ Check receptionist position
      const { data: st, error: stErr } = await supabase
        .from("staff")
        .select("name, position")
        .eq("id", prof.staff_id)
        .single();

      if (stErr || !st) {
        setMsg("Staff record missing.");
        return;
      }

      const position = String(st.position || "").toLowerCase();

      if (position !== "receptionist") {
        if (position === "manager") router.push("/manager");
        else if (position === "massage_therapist") router.push("/staff");
        else if (position === "spa_attendant") router.push("/attendant");
        else router.push("/dashboard");
        return;
      }

      setName(st.name || prof.full_name || "Receptionist");

      // 4️⃣ Load today's appointments
      const { data: appts, error: aErr } = await supabase
        .from("appointments")
        .select(`
          id,
          appt_time,
          duration_minutes,
          staff_id,
          rooms(name),
          services(name, category),
          customer:profiles!appointments_user_id_profiles_fkey(full_name)
        `)
        .eq("appt_date", today)
        .order("appt_time", { ascending: true });

      if (aErr) {
        setMsg(aErr.message);
        return;
      }

      // 5️⃣ Load staff with emails
      const { data: staffList, error: staffErr } = await supabase
        .from("staff")
        .select("id, name, position, email");

      if (staffErr) {
        setMsg(staffErr.message);
        return;
      }

      const staffMap = new Map<
        number,
        { name: string; position: string; email: string | null }
      >();

      (staffList ?? []).forEach((s: any) => {
        staffMap.set(s.id, {
          name: s.name,
          position: s.position,
          email: s.email ?? null,
        });
      });

      const mapped: Row[] = (appts ?? []).map((r: any) => {
        const s = r.staff_id ? staffMap.get(r.staff_id) : null;

        return {
          id: r.id,
          appt_time: String(r.appt_time).slice(0, 5),
          duration_minutes: r.duration_minutes,
          service_name: r.services?.name ?? null,
          category: r.services?.category ?? null,
          room_name: r.rooms?.name ?? null,
          customer_name: r.customer?.full_name ?? null,
          staff_id: r.staff_id ?? null,
          staff_name: s?.name ?? null,
          staff_position: s?.position ?? null,
          therapist_email: s?.email ?? null,
        };
      });

      setRows(mapped);
    })();
  }, [router, today]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function gmailLink(to: string, subject: string, body: string) {
    const url = new URL("https://mail.google.com/mail/");
    url.searchParams.set("view", "cm");
    url.searchParams.set("fs", "1");
    url.searchParams.set("to", to);
    url.searchParams.set("su", subject);
    url.searchParams.set("body", body);
    return url.toString();
  }

  return (
    <main style={{ maxWidth: 1000, margin: "40px auto", fontFamily: "Arial" }}>
      <h2>Receptionist — Today’s Schedule</h2>
      <p>Hello, <b>{name}</b></p>
      <p>Date: <b>{today}</b></p>

      <button onClick={logout}>Logout</button>

      {msg && <p style={{ color: "crimson" }}>{msg}</p>}

      <div style={{ marginTop: 20 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Time</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Staff</th>
              <th>Room</th>
              <th>Ping</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6}>No appointments today.</td>
              </tr>
            ) : (
              rows.map((r) => {
                const subject = `Ginhawa Appointment Reminder (${today})`;
                const body = `Hi ${r.staff_name},

You have an appointment today.

Time: ${r.appt_time}
Customer: ${r.customer_name}
Service: ${r.service_name}
Room: ${r.room_name}

- Ginhawa Reception`;

                return (
                  <tr key={r.id}>
                    <td>{r.appt_time}</td>
                    <td>{r.customer_name}</td>
                    <td>{r.service_name}</td>
                    <td>
                      {r.staff_name} ({r.staff_position})
                    </td>
                    <td>{r.room_name}</td>
                    <td>
                      {r.therapist_email ? (
                        <button
                          onClick={() =>
                            window.open(
                              gmailLink(r.therapist_email!, subject, body),
                              "_blank"
                            )
                          }
                        >
                          Ping Gmail
                        </button>
                      ) : (
                        <span style={{ color: "crimson" }}>
                          No email
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}