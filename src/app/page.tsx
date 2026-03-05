"use client";

import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export default function Home() {
  return (
    <SiteShell right={<span className="pill">A safe, private wellness check-in.</span>}>
      <section className="gridHero">
        <div>
          <h1 className="h1">What would<br />you like help<br />with today?</h1>

          <p className="sub">
            Book spa services, preview service videos, explore wellness activities,
            and earn milestone badges — guided by Ginhawa Buddy.
          </p>

          <div className="heroActions">
            <Link className="btn btnPrimary" href="/dashboard">Start My Guided Check-In</Link>
            <Link className="btn" href="/services">Explore Spa Services</Link>
          </div>

          <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span className="pill">Book Spa</span>
            <span className="pill">Preview Videos</span>
            <span className="pill">Badges</span>
            <span className="pill">Activities</span>
          </div>
        </div>

        <div className="heroImage">
          <img src="/hero.jpg" alt="Wellness" />
        </div>
      </section>
    </SiteShell>
  );
}