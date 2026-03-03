"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const router = useRouter();

  async function login() {
    setMsg("");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return setMsg(error.message);

  // ✅ Get logged in user
  const { data: authData, error: userError } =
    await supabase.auth.getUser();

  if (userError || !authData?.user) {
    return setMsg("Login failed.");
  }

  const user = authData.user;

  // ✅ Get role from profiles table
  const { data: who } = await supabase
  .from("staff_identity_view")
  .select("role, position")
  .eq("user_id", user.id)
  .single();

if (who?.role !== "staff") router.push("/dashboard");
else if (who?.position === "manager") router.push("/manager");
else router.push("/staff");
  }

  return (
    <main style={{ maxWidth: 520, margin: "40px auto", fontFamily: "Arial" }}>
      <h2>Login</h2>
      {msg && <p style={{ color: "crimson" }}>{msg}</p>}
      <input style={{ width: "100%", padding: 10, marginBottom: 10 }} placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
      <input style={{ width: "100%", padding: 10, marginBottom: 10 }} placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
      <button onClick={login} style={{ padding: "10px 14px" }}>Login</button>
    </main>
  );
}