"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [fullName, setFullName] = useState("Customer");
  const [email, setEmail] = useState("");
  const [apptCount, setApptCount] = useState(0);

  useEffect(() => {
    (async () => {
      setMsg("");
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return router.push("/login");

      setEmail(auth.user.email ?? "");

      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", auth.user.id)
        .single();

      if (prof?.role === "staff") {
        // staff should not use customer dashboard
        router.push("/staff");
        return;
      }

      if (prof?.full_name) setFullName(prof.full_name);

      const { count, error } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", auth.user.id);

      if (!error) setApptCount(count ?? 0);
    })();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <SiteShell right={<Link className="btn" href="/services">Services</Link>}>
      <div className="card cardPad">
        <h2 style={{ marginTop: 0 }}>Dashboard</h2>
        <p style={{ marginTop: 6, color: "var(--muted)" }}>
          Welcome, <b>{fullName}</b><br />{email}
        </p>

        {msg && <div className="notice">{msg}</div>}

        <div className="kpiGrid" style={{ marginTop: 12 }}>
          <div className="kpi"><span className="pill">Bookings</span><b>{apptCount}</b></div>
          <div className="kpi"><span className="pill">Badges</span><b>{apptCount >= 2 ? 1 : 0}</b></div>
          <div className="kpi"><span className="pill">Wellness</span><b>Guide</b></div>
          <div className="kpi"><span className="pill">Status</span><b>Active</b></div>
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="btn" href="/services">Spa Services</Link>
          <Link className="btn btnPrimary" href="/book">Book Appointment</Link>
          <Link className="btn" href="/badges">Badges</Link>
          <Link className="btn" href="/activities">Wellness Activities</Link>
          <button className="btn" onClick={logout}>Logout</button>
        </div>
      </div>
    </SiteShell>
  );
}