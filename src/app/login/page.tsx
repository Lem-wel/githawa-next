"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function login() {
    setMsg("");

    // 1) Sign in
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMsg(error.message);
      return;
    }

    // 2) Get logged-in user
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData.user) {
      setMsg("Login succeeded but user session not found.");
      return;
    }

    const userId = authData.user.id;

    // 3) Load profile (role + staff_id)
    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("role, staff_id")
      .eq("id", userId)
      .single();

    if (profErr || !prof) {
      setMsg("No profile found for this account. (profiles row missing)");
      return;
    }

    // 4) Customer redirect
    if (prof.role !== "staff") {
      router.push("/dashboard");
      return;
    }

    // 5) Staff must be linked
    if (!prof.staff_id) {
      setMsg("Staff account not linked yet (profiles.staff_id is null).");
      return;
    }

    // 6) Load staff position
    const { data: st, error: stErr } = await supabase
      .from("staff")
      .select("position")
      .eq("id", prof.staff_id)
      .single();

    if (stErr || !st) {
      setMsg("Staff record missing or position not found.");
      return;
    }

    // 7) Redirect by position
    const pos = (st.position || "").trim().toLowerCase();

    if (pos === "manager") router.push("/manager");
    else if (pos === "receptionist") router.push("/receptionist");
    else if (pos === "spa_attendant") router.push("/attendant");
    else router.push("/staff"); // default: massage therapist
  }

  return (
    <main style={{ maxWidth: 520, margin: "40px auto", fontFamily: "Arial" }}>
      <h2>Login</h2>

      {msg && <p style={{ color: "crimson" }}>{msg}</p>}

      <input
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={login} style={{ padding: "10px 14px" }}>
        Login
      </button>
    </main>
  );
}