"use client";

import SiteShell from "@/components/SiteShell";
import Link from "next/link";

const activities = [
  { title: "Yoga", desc: "Improve flexibility & calm.", url: "https://www.mindbodyonline.com/" },
  { title: "Pilates", desc: "Core strength training.", url: "https://www.classpass.com/" },
  { title: "Gym Workout", desc: "Build endurance & strength.", url: "https://www.anytimefitness.com/" },
];

export default function ActivitiesPage() {
  return (
    <SiteShell right={<Link className="btn" href="/dashboard">Dashboard</Link>}>
      <div className="card cardPad">
        <h2 style={{ marginTop: 0 }}>Wellness Activities</h2>
        <p style={{ color: "var(--muted)" }}>
          Explore external wellness activities and book on their official sites.
        </p>
      </div>

      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
        {activities.map((a) => (
          <div key={a.title} className="card cardPad" style={{ boxShadow: "none" }}>
            <div className="pill">External Booking</div>
            <h3 style={{ margin: "10px 0 6px" }}>{a.title}</h3>
            <p style={{ margin: 0, color: "var(--muted)" }}>{a.desc}</p>
            <div style={{ marginTop: 12 }}>
              <a className="btn btnPrimary" href={a.url} target="_blank" rel="noreferrer">Go to website</a>
            </div>
          </div>
        ))}
      </div>
    </SiteShell>
  );
}