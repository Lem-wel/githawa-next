"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import SiteShell from "@/components/SiteShell";

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
  staff_email: string | null;
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
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return router.push("/login");

      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, role, staff_id")
        .eq("id", auth.user.id)
        .single();

      if (!prof) return setMsg("Profile not found.");
      if (prof.role !== "staff") return router.push("/dashboard");
      if (!prof.staff_id) return setMsg("Staff not linked (profiles.staff_id is null).");

      const { data: st } = await supabase
        .from("staff")
        .select("name, position")
        .eq("id", prof.staff_id)
        .single();

      const pos = String(st?.position || "").trim().toLowerCase();
      if (pos !== "receptionist") {
        if (pos === "manager") router.push("/manager");
        else if (pos === "massage_therapist") router.push("/staff");
        else if (pos === "spa_attendant") router.push("/attendant");
        else router.push("/dashboard");
        return;
      }

      setName(st?.name || prof.full_name || "Receptionist");

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

      if (aErr) return setMsg(aErr.message);

      const { data: staffList, error: sErr } = await supabase
        .from("staff")
        .select("id,name,position,email");

      if (sErr) return setMsg(sErr.message);

      const staffMap = new Map<number, { name: string; position: string; email: string | null }>();
      (staffList ?? []).forEach((s: any) => {
        staffMap.set(s.id, { name: s.name, position: s.position, email: s.email ?? null });
      });

      setRows((appts ?? []).map((r: any) => {
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
          staff_email: s?.email ?? null,
        };
      }));
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
    <SiteShell>
      <div className="card cardPad">
        <h2 style={{ marginTop: 0 }}>Receptionist — Today’s Schedule</h2>
        <p style={{ color: "var(--muted)" }}>Hello, <b>{name}</b> • Date: <b>{today}</b></p>
        <button className="btn" onClick={logout}>Logout</button>
        {msg && <div className="notice" style={{ marginTop: 12 }}>{msg}</div>}
      </div>

      <div className="card cardPad" style={{ marginTop: 14 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Time</th><th>Customer</th><th>Service</th><th>Category</th><th>Staff</th><th>Room</th><th>Ping</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7}>No appointments today.</td></tr>
            ) : rows.map((r) => {
              const subject = `Ginhawa Reminder (${today})`;
              const body =
`Hi ${r.staff_name ?? "Staff"},

Reminder: you have an appointment today.

Time: ${r.appt_time}
Customer: ${r.customer_name ?? "-"}
Service: ${r.service_name ?? "-"}
Room: ${r.room_name ?? "-"}

- Ginhawa Reception`;

              return (
                <tr key={r.id}>
                  <td>{r.appt_time}</td>
                  <td>{r.customer_name ?? "—"}</td>
                  <td>{r.service_name ?? "—"}</td>
                  <td>{r.category ?? "—"}</td>
                  <td>{r.staff_name ?? "—"} {r.staff_position ? `(${r.staff_position})` : ""}</td>
                  <td>{r.room_name ?? "—"}</td>
                  <td>
                    {r.staff_email ? (
                      <button className="btn btnPrimary" onClick={() => window.open(gmailLink(r.staff_email!, subject, body), "_blank")}>
                        Ping Gmail
                      </button>
                    ) : (
                      <span style={{ color: "#9a2e2e", fontWeight: 800 }}>No email</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SiteShell>
  );
}