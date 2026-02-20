"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const router = useRouter();

  async function register() {
    setMsg("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return setMsg(error.message);

    // create profile
    const userId = data.user?.id;
    if (userId) {
      const { error: profErr } = await supabase
        .from("profiles")
        .insert({ id: userId, full_name: fullName, role: "customer" });
      if (profErr) return setMsg(profErr.message);
    }
    router.push("/login");
  }

  return (
    <div style={{ maxWidth: 520, margin: "40px auto" }}>
      <h2>Create Account</h2>
      {msg && <p style={{ color: "crimson" }}>{msg}</p>}
      <input placeholder="Full name" value={fullName} onChange={e=>setFullName(e.target.value)} />
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button onClick={register}>Register</button>
    </div>
  );
}