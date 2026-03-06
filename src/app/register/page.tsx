"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser();
      setLoggedIn(!!data.user);
    }
    checkUser();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const isRegisterPage = pathname === "/register";

  return (
    <div>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #ddd",
          paddingBottom: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src="/logo.png" alt="Ginhawa" style={{ width: 72 }} />
          <h1 style={{ margin: 0 }}>Ginhawa</h1>
        </div>

        <nav style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Link href="/">Home</Link>
          <Link href="/contact">Contact</Link>

          {/* Hide Dashboard & Logout only on register page */}
          {!isRegisterPage && loggedIn && (
            <>
              <Link href="/dashboard" className="btn">
                Dashboard
              </Link>

              <button className="btn" onClick={logout}>
                Logout
              </button>
            </>
          )}
        </nav>
      </header>

      <main>{children}</main>
    </div>
  );
}