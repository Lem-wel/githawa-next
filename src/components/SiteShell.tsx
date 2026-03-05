"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteShell({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  const path = usePathname();
  const active = (href: string) => (path === href ? { textDecoration: "underline" } : undefined);

  return (
    <div className="container">
      <header className="navbar">
        <div className="brand">
          <div className="brand-badge">LOGO</div>
          <span>Ginhawa</span>
        </div>

        <nav className="navlinks">
          <Link style={active("/")} href="/">Home</Link>
          <Link style={active("/contact")} href="/contact">Contact</Link>
        </nav>

        <div className="navright">
          {right}
          <Link className="btn" href="/login">Log In</Link>
        </div>
      </header>

      {children}
    </div>
  );
}