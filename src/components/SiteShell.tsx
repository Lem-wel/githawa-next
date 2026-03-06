"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SiteShell({
  children,
  right,
  hideUserActions = false,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
  hideUserActions?: boolean;
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
        <div className="brand">
          <div className="brand-badge">
            <Image
              src="/logo.png"
              alt="Ginhawa Logo"
              width={72}
              height={72}
              priority
            />
          </div>
          <span style={{ fontWeight: 600 }}>Ginhawa</span>
        </div>

        <nav className="navlinks">
          <Link style={active("/")} href="/">
            Home
          </Link>
          <Link style={active("/contact")} href="/contact">
            Contact
          </Link>
        </nav>

        <div className="navright">
          {right}

          {!loading && (
            <>
              {loggedIn ? (
                <>
                  {!hideUserActions && (
                    <>
                      <Link className="btn" href="/dashboard">
                        Dashboard
                      </Link>
                      <button className="btn" onClick={logout}>
                        Logout
                      </button>
                    </>
                  )}
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

      <button
        onClick={() => (window.location.href = "/feedback")}
        style={{
          position: "fixed",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--sage)",
          color: "white",
          padding: "12px 20px",
          borderRadius: "999px",
          border: "none",
          fontWeight: 600,
          boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
          cursor: "pointer",
          zIndex: 999,
        }}
      >
        💬 Leave Feedback
      </button>
    </div>
  );
}