"use client";

import SiteShell from "@/components/SiteShell";

export default function ContactPage() {
  return (
    <SiteShell>
  <div
    style={{
      maxWidth: 1280,
      margin: "0 auto",
      padding: "46px 28px 64px",
      display: "flex",
      justifyContent: "center" // centers the card
    }}
  >
    <div
      className="card cardPad"
      style={{
        width: "100%",
        maxWidth: 620
      }}
    >
      <h2 style={{ marginTop: 0 }}>Contact</h2>

      <p>For inquiries, bookings, or support, contact us:</p>

      <ul>
        <li>Email: ginhawa@gmail.com</li>
        <li>Phone: +63 9682748775</li>
        <li>Location: Sampaloc, Manila, Philippines</li>
      </ul>
    </div>
  </div>
</SiteShell>
  );
}