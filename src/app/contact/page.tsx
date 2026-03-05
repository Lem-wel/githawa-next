"use client";

import SiteShell from "@/components/SiteShell";

export default function ContactPage() {
  return (
    <SiteShell>
      <div className="card cardPad" style={{ maxWidth: 720 }}>
        <h2 style={{ marginTop: 0 }}>Contact</h2>
        <p style={{ color: "var(--muted)" }}>
          For inquiries, bookings, or support, contact us:
        </p>
        <ul>
          <li>Email: ginhawa@gmail.com</li>
          <li>Phone: +63 9xx xxx xxxx</li>
          <li>Location: Sampaloc, Manila, Philippines</li>
        </ul>
      </div>
    </SiteShell>
  );
}