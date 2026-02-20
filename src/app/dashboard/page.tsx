"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        router.push("/login");
        return;
      }

      setEmail(user.email ?? "");

      // optional: load profile name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      setName(profile?.full_name ?? "Customer");
    })();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", fontFamily: "Arial" }}>
      <h2>Dashboard</h2>
      <p>Welcome, <b>{name}</b></p>
      <p style={{ color: "#666" }}>{email}</p>

      <nav style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
        <Link href="/services">Spa Services</Link>
        <Link href="/book">Book Appointment</Link>
        <Link href="/rewards">Badges</Link>
        <Link href="/activities">Wellness Activities</Link>
      </nav>

      <div style={{ marginTop: 30 }}>
        <button onClick={logout} style={{ padding: "10px 14px" }}>Logout</button>
      </div>
    </main>
  );
}