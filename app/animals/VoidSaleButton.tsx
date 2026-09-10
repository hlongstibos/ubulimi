"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function VoidSaleButton({ saleId }: { saleId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    const { error: rpcErr } = await supabase.rpc("void_sale", {
      p_sale_id: saleId,
    });
    if (rpcErr) {
      setError(rpcErr.message);
      setBusy(false);
      return;
    }
    setBusy(false);
    setConfirming(false);
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--text-muted)",
          fontSize: 12.5,
          fontWeight: 600,
          cursor: "pointer",
          padding: 0,
        }}
      >
        Remove
      </button>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
        Remove sale &amp; set the animal back to active?
      </span>
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        style={{
          background: "#b3413e",
          border: "none",
          color: "#fff",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          padding: "4px 10px",
          cursor: busy ? "default" : "pointer",
        }}
      >
        {busy ? "Removing…" : "Confirm"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={busy}
        style={{
          background: "transparent",
          border: "1px solid var(--card-border)",
          borderRadius: 999,
          color: "var(--text-muted)",
          fontSize: 12,
          fontWeight: 600,
          padding: "4px 10px",
          cursor: "pointer",
        }}
      >
        Cancel
      </button>
      {error && (
        <span style={{ color: "#b3413e", fontSize: 12 }}>{error}</span>
      )}
    </span>
  );
}
