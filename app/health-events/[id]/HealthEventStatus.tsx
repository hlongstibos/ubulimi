"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function HealthEventStatus({
  eventId,
  status,
}: {
  eventId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = status === "resolved" ? "open" : "resolved";

  async function toggle() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("health_events")
      .update({ status: next })
      .eq("id", eventId);
    if (err) {
      setError(err.message);
      setBusy(false);
      return;
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        style={{
          padding: "5px 12px",
          borderRadius: 999,
          border: "1px solid var(--forest)",
          background: "transparent",
          color: "var(--forest)",
          fontSize: 12.5,
          fontWeight: 600,
          cursor: busy ? "default" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {busy
          ? "…"
          : status === "resolved"
            ? "Reopen"
            : "Mark resolved"}
      </button>
      {error && <span style={{ color: "#b3413e", fontSize: 12 }}>{error}</span>}
    </span>
  );
}
