"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import SiteShell from "@/components/SiteShell";

export default function FeedbackPage() {
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
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

      if (rating < 1 || rating > 5) {
        setMsg("Please select a star rating.");
        return;
      }

      const { error } = await supabase.from("feedback").insert({
        user_id: auth.user.id,
        message: text.trim(),
        rating,
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
          rating,
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
      setRating(0);
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

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Star Rating</label>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                aria-label={`${value} star${value > 1 ? "s" : ""}`}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "6px 10px",
                  background: value <= rating ? "#fff5d8" : "#fff",
                  color: value <= rating ? "#b26b00" : "#999",
                  fontSize: 22,
                  lineHeight: 1,
                  cursor: "pointer",
                }}
              >
                {value <= rating ? "★" : "☆"}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
            {rating > 0 ? `${rating} / 5 selected` : "Select 1 to 5 stars"}
          </div>
        </div>

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