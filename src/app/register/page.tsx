"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
      if (!fullName.trim() || !email.trim() || !password.trim()) {
        setMsg("Please complete all required fields.");
        setLoading(false);
        return;
      }

      let referredByCode: string | null = null;
      let referralOwnerId: string | null = null;

      if (referralInput.trim()) {
        const enteredCode = referralInput.trim().toUpperCase();

        const { data: referralOwner, error: referralErr } = await supabase
          .from("profiles")
          .select("id, referral_code")
          .eq("referral_code", enteredCode)
          .maybeSingle();

        if (referralErr) {
          setMsg(referralErr.message);
          setLoading(false);
          return;
        }

        if (!referralOwner) {
          setMsg("Invalid referral code.");
          setLoading(false);
          return;
        }

        referredByCode = enteredCode;
        referralOwnerId = referralOwner.id;
      }

      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
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

      const myReferralCode = await makeUniqueReferralCode(fullName);

      const { error: profileErr } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: fullName.trim(),
        role: "customer",
        referral_code: myReferralCode,
        referred_by: referredByCode,
        referral_unlocked: false,
      });

      if (profileErr) {
        setMsg(profileErr.message);
        setLoading(false);
        return;
      }

      if (referralOwnerId) {
        const { error: unlockErr } = await supabase
          .from("profiles")
          .update({ referral_unlocked: true })
          .eq("id", referralOwnerId);

        if (unlockErr) {
          setMsg(unlockErr.message);
          setLoading(false);
          return;
        }
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
    <SiteShell hideUserActions>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <div className="card cardPad" style={{ maxWidth: 560, width: "100%" }}>
          <h2 style={{ marginTop: 0 }}>Sign Up</h2>

          {msg && (
            <div
              className={msg.includes("✅") ? "noticeOk" : "notice"}
              style={{ marginBottom: 12 }}
            >
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

          <button
            className="btn btnPrimary"
            onClick={register}
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p
            style={{
              marginTop: 14,
              textAlign: "center",
              color: "var(--muted)",
              fontSize: 14,
            }}
          >
            Already have an account?{" "}
            <Link
              href="/login"
              style={{
                color: "var(--text)",
                fontWeight: 600,
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </SiteShell>
  );
}