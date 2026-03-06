"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    }

    checkUser();
  }, []);

  return (
    <SiteShell>
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
            Book spa services, view service previews inside Services, and earn
            milestone badges — guided by Ginhawa Buddy.
          </p>

          <div className="heroActions">
            {!user && (
              <Link className="btn btnPrimary" href="/register">
                Sign Up
              </Link>
            )}
            {user && (
              <Link className="btn btnPrimary" href="/book">
                Book Appointment
              </Link>
            )}

            <Link className="btn" href="/services">
              Explore Spa Services
            </Link>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="pill" href="/badges">
              Badges
            </Link>
            <Link className="pill" href="/activities">
              Wellness Activities
            </Link>
          </div>
        </div>

        <div className="heroImage">
          <img src="/hero.jpg" alt="Wellness" />
        </div>
      </section>
    </SiteShell>
  );
}