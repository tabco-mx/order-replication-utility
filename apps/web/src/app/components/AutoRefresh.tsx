"use client";

// Re-runs the current server component every `intervalMs` by asking the router to refresh.
// This is the whole "real-time" story — no WebSockets, just a periodic server re-render.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRefresh({ intervalMs = 2000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
