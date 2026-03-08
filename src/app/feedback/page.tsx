"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import SiteShell from "@/components/SiteShell";

export default function FeedbackPage() {
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    try {
      setLoading(true);
      setMsg("");

      const { data: auth } = await supabase.auth.getUser();

      if (!auth.user) {
        setMsg("Login first.");
        return;
      }

      if (!text.trim()) {
        setMsg("Please enter your feedback first.");
        return;
      }

      const { error } = await supabase.from("feedback").insert({
        user_id: auth.user.id,
        message: text.trim(),
      });

      if (error) {
        setMsg(error.message);
        return;
      }

      const emailRes = await fetch("/api/send-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text.trim(),
          userEmail: auth.user.email,
          userId: auth.user.id,
        }),
      });

      const emailData = await emailRes.json();

      if (!emailRes.ok) {
        setMsg("Feedback saved, but email failed: " + (emailData.error || "Unknown error"));
        return;
      }

      setMsg("Thank you for your feedback 💚");
      setText("");
    } catch (err: any) {
      setMsg(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteShell>
      <div className="card cardPad">
        <h2>Customer Feedback</h2>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your spa experience..."
          style={{
            width: "100%",
            minHeight: 120,
            padding: 10,
            borderRadius: 10,
          }}
        />

        <button
          className="btn btnPrimary"
          style={{ marginTop: 10 }}
          onClick={submit}
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit Feedback"}
        </button>

        {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
      </div>
    </SiteShell>
  );
}