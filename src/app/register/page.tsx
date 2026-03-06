"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SiteShell from "@/components/SiteShell";
import { supabase } from "@/lib/supabaseClient";

function generateReferralCode(name: string) {
  const clean = (name || "GIN")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 3);

  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${clean}${random}`;
}

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralInput, setReferralInput] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function makeUniqueReferralCode(name: string) {
    for (let i = 0; i < 10; i++) {
      const code = generateReferralCode(name);

      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("referral_code", code)
        .maybeSingle();

      if (error) throw error;
      if (!data) return code;
    }

    throw new Error("Failed to generate unique referral code.");
  }

  async function register() {
    setMsg("");
    setLoading(true);

    try {
      if (!fullName || !email || !password) {
        setMsg("Please complete all required fields.");
        setLoading(false);
        return;
      }

      // optional: validate referred_by code if entered
      if (referralInput.trim()) {
        const { data: refProfile, error: refErr } = await supabase
          .from("profiles")
          .select("id, referral_code")
          .eq("referral_code", referralInput.trim().toUpperCase())
          .maybeSingle();

        if (refErr) throw refErr;
        if (!refProfile) {
          setMsg("Referral code not found.");
          setLoading(false);
          return;
        }
      }

      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpErr) {
        setMsg(signUpErr.message);
        setLoading(false);
        return;
      }

      const user = signUpData.user;
      if (!user) {
        setMsg("Signup succeeded but no user was returned.");
        setLoading(false);
        return;
      }

      const referralCode = await makeUniqueReferralCode(fullName);

      const { error: profileErr } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: fullName,
        role: "customer",
        referral_code: referralCode,
        referred_by: referralInput.trim() ? referralInput.trim().toUpperCase() : null,
      });

      if (profileErr) {
        setMsg(profileErr.message);
        setLoading(false);
        return;
      }

      setMsg("Account created successfully ✅");
      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (err: any) {
      setMsg(err.message || "Registration failed.");
    }

    setLoading(false);
  }

  return (
    <SiteShell>
      <div className="card cardPad" style={{ maxWidth: 560 }}>
        <h2 style={{ marginTop: 0 }}>Sign Up</h2>

        {msg && (
          <div className={msg.includes("✅") ? "noticeOk" : "notice"} style={{ marginBottom: 12 }}>
            {msg}
          </div>
        )}

        <div style={{ marginBottom: 10 }}>
          <label>Full Name</label>
          <input
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Email</label>
          <input
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            type="email"
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Password</label>
          <input
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            type="password"
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label>Referral Code (optional)</label>
          <input
            className="input"
            value={referralInput}
            onChange={(e) => setReferralInput(e.target.value)}
            placeholder="Enter referral code"
          />
        </div>

        <button className="btn btnPrimary" onClick={register} disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </div>
    </SiteShell>
  );
}