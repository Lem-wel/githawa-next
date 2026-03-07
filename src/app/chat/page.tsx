"use client";

import SiteShell from "@/components/SiteShell";
import GinhawaBuddy from "@/components/GinhawaBuddy";

export default function ChatPage() {
  return (
    <SiteShell>
      <div style={{ maxWidth: 900, margin: "40px auto" }}>
        <h2>Chat with Ginhawa Buddy</h2>

        <GinhawaBuddy />
      </div>
    </SiteShell>
  );
}