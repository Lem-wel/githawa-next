"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function RewardsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return setMsg("Please login first.");

      const { data, error } = await supabase
        .from("user_badges")
        .select("earned_at, badges(name, description)")
        .eq("user_id", uid)
        .order("earned_at", { ascending: false });

      if (error) setMsg(error.message);
      setRows(data ?? []);
    })();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "30px auto" }}>
      <h2>Badges / Rewards</h2>
      {msg && <p style={{ color: "crimson" }}>{msg}</p>}
      {!msg && rows.length === 0 && <p>No badges yet. Book 2 appointments to earn rewards.</p>}
      {rows.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr><th align="left">Badge</th><th align="left">Description</th><th align="left">Earned</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ padding: 8, borderTop: "1px solid #eee" }}><b>{r.badges?.name}</b></td>
                <td style={{ padding: 8, borderTop: "1px solid #eee" }}>{r.badges?.description}</td>
                <td style={{ padding: 8, borderTop: "1px solid #eee" }}>{new Date(r.earned_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}