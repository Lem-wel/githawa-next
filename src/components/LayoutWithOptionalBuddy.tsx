"use client";

import { usePathname } from "next/navigation";
import GinhawaBuddy from "@/components/GinhawaBuddy";

export default function LayoutWithOptionalBuddy() {
  const pathname = usePathname();

  const hideBuddy =
    pathname === "/chat-embed" || pathname.startsWith("/chat-embed/");

  if (hideBuddy) return null;

  return <GinhawaBuddy />;
}