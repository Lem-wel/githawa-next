"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SiteShell({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  const active = (href: string) =>
    path === href ? { textDecoration: "underline" } : undefined;

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setLoggedIn(!!data.session);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="container">
      <header className="navbar">
        {/* ✅ Logo + Brand */}
        <div className="brand">
          <div
            className="brand-badge"
            style={{ overflow: "hidden", padding: 0 }}
            title="Ginhawa"
          >
            <Image
              src="/logo.jpg"
              alt="Ginhawa Logo"
              width={44}
              height={34}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              priority
            />
          </div>
          <span>Ginhawa</span>
        </div>

        {/* Links */}
        <nav className="navlinks">
          <Link style={active("/")} href="/">
            Home
          </Link>
          <Link style={active("/contact")} href="/contact">
            Contact
          </Link>
        </nav>

        {/* Right area */}
        <div className="navright">
          {right}

          {/* ✅ While loading: show nothing to avoid flicker */}
          {!loading && (
            <>
              {loggedIn ? (
                <>
                  <Link className="btn" href="/dashboard">
                    Dashboard
                  </Link>
                  <button className="btn" onClick={logout}>
                    Logout
                  </button>
                </>
              ) : (
                <Link className="btn" href="/login">
                  Log In
                </Link>
              )}
            </>
          )}
        </div>
      </header>

      {children}
    </div>
  );
}