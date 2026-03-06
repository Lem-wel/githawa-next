"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import SiteShell from "@/components/SiteShell";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function login() {
    setMsg("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setMsg(error.message);

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData.user) return setMsg("Login succeeded but session not found.");

    const userId = authData.user.id;

    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("role, staff_id")
      .eq("id", userId)
      .single();

    if (profErr || !prof) return setMsg("No profile found for this account.");

    // Customer
    if (prof.role !== "staff") {
      router.push("/dashboard");
      return;
    }

    if (!prof.staff_id) {
      setMsg("Staff not linked yet (profiles.staff_id is null).");
      return;
    }

    const { data: st, error: stErr } = await supabase
      .from("staff")
      .select("position")
      .eq("id", prof.staff_id)
      .single();

    if (stErr || !st) return setMsg("Staff record missing.");

    const pos = String(st.position || "").trim().toLowerCase();
    if (pos === "manager") router.push("/manager");
    else if (pos === "receptionist") router.push("/receptionist");
    else if (pos === "spa_attendant") router.push("/attendant");
    else router.push("/staff"); // massage therapist default
  }

  return (
  <SiteShell>
  <div
    style={{
      maxWidth: 1280,
      margin: "0 auto",
      padding: "46px 28px 64px", // like your .container spacing
      display: "flex",
      justifyContent: "center"
    }}
  >
    <div
      className="card cardPad"
      style={{
        width: "100%",
        maxWidth: 620,
        padding: 34,
      }}
    >
       <h2
          style={{
            marginTop: 0,
            fontFamily: "var(--font-heading)",
            fontSize: 34,
          }}
        >
          Log In
        </h2>

        {msg && (
          <div className="notice" style={{ marginBottom: 12 }}>
            {msg}
          </div>
        )}

        <input
          className="input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div style={{ height: 12 }} />
        <input
          className="input"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div style={{ height: 16 }} />

        <button className="btn btnPrimary" onClick={login}>
          Log In
        </button>

<p
  style={{
    marginTop: 14,
    textAlign: "center",
    color: "var(--muted)",
    fontSize: 14
  }}
>
  Don’t have an account?{" "}
  <Link
    href="/register"
    style={{
      color: "var(--text)",
      fontWeight: 600,
      textDecoration: "underline",
      cursor: "pointer"
    }}
  >
    Sign up
  </Link>
</p>
      {/* your login form here */}
      
    </div>
  </div>
</SiteShell>
);
}