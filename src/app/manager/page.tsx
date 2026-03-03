"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ManagerPage() {
  const [msg, setMsg] = useState("");
  const [dataDump, setDataDump] = useState<any>(null);

  useEffect(() => {
    (async () => {
      setMsg("Loading...");

      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setMsg("NOT LOGGED IN");
        return;
      }

      // ✅ MAIN QUERY (with explicit FK)
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
          customer:profiles!appointments_user_id_fkey(full_name)
        `)
        .order("appt_date", { ascending: true })
        .order("appt_time", { ascending: true });

      if (error) {
        setMsg("QUERY ERROR: " + error.message);
        setDataDump(null);
        return;
      }

      setMsg("Loaded rows: " + (data?.length ?? 0));
      setDataDump(data ?? []);
    })();
  }, []);

  return (
    <main style={{ padding: 30, fontFamily: "Arial" }}>
      <h1 style={{ color: "red" }}>MANAGER DEBUG PAGE ✅</h1>
      <p><b>Status:</b> {msg}</p>

      <pre style={{ background: "#111", color: "#0f0", padding: 12, borderRadius: 8, overflowX: "auto" }}>
        {JSON.stringify(dataDump, null, 2)}
      </pre>
    </main>
  );
}