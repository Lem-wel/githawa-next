"use client";

import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export default function Home() {
  return (
    <SiteShell right={<span className="pill">A personalized spa and wellness website.</span>}>
      <section className="gridHero">
        <div>
          <h1 className="h1">
            What would
            <br />
            you like help
            <br />
            with today?
          </h1>

          <p className="sub">
            Book spa services, view service previews inside Services, and earn milestone badges — guided
            by Ginhawa Buddy.
          </p>

          <div className="heroActions">
            <Link className="btn btnPrimary" href="/dashboard">
              Book an Appointment
            </Link>
            <Link className="btn" href="/services">
              Explore Spa Services
            </Link>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="pill" href="/book">Book Spa</Link>
            <Link className="pill" href="/badges">Badges</Link>
          </div>
        </div>

        <div className="heroImage">
          <img src="/hero.jpg" alt="Wellness" />
        </div>
      </section>
    </SiteShell>
  );
}