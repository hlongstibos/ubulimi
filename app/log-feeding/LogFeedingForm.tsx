"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Camp = { id: string; name: string };
type Feed = { id: string; name: string; stock_qty: number; unit: string };

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  color: "var(--text-muted)",
  marginBottom: 4,
};

const fieldStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: 10,
  border: "1px solid var(--card-border)",
  borderRadius: 6,
  background: "#fff",
};

const hintStyle: React.CSSProperties = {
  color: "var(--text-muted)",
  fontSize: 13,
  margin: "6px 0 0",
};

export default function LogFeedingForm({
  camps,
  feeds,
  home,
}: {
  camps: Camp[];
  feeds: Feed[];
  home: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [campId, setCampId] = useState("");
  const [feedId, setFeedId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);

  const selectedFeed = feeds.find((f) => f.id === feedId) ?? null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current) return;

    if (!campId) {
      setError("Select a camp.");
      return;
    }
    if (!feedId) {
      setError("Select a feed.");
      return;
    }
    if (!(parseFloat(quantity) > 0)) {
      setError("Enter a quantity greater than 0.");
      return;
    }

    inFlight.current = true;
    setSaving(true);
    setError(null);

    const { error: rpcErr } = await supabase.rpc("log_feeding_event", {
      p_camp_id: campId,
      p_feed_id: feedId,
      p_quantity: parseFloat(quantity),
    });

    if (rpcErr) {
      setError(rpcErr.message);
      setSaving(false);
      inFlight.current = false;
      return;
    }

    router.push(home);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 22 }}>
      <div>
        <span style={labelStyle}>Camp</span>
        <select
          value={campId}
          onChange={(e) => setCampId(e.target.value)}
          style={fieldStyle}
        >
          <option value="">Choose a camp…</option>
          {camps.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {camps.length === 0 && (
          <p style={hintStyle}>No camps yet — add one under Camps.</p>
        )}
      </div>

      <div>
        <span style={labelStyle}>Feed</span>
        <select
          value={feedId}
          onChange={(e) => setFeedId(e.target.value)}
          style={fieldStyle}
        >
          <option value="">Choose a feed…</option>
          {feeds.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} — {f.stock_qty} {f.unit} in stock
            </option>
          ))}
        </select>
        {feeds.length === 0 && (
          <p style={hintStyle}>No feed yet — add some under Feed.</p>
        )}
      </div>

      <div>
        <span style={labelStyle}>
          Quantity{selectedFeed ? ` (${selectedFeed.unit})` : ""}
        </span>
        <input
          type="number"
          step="any"
          min="0"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          style={fieldStyle}
        />
      </div>

      {error && (
        <p style={{ color: "#b3413e", fontSize: 13, margin: 0 }}>{error}</p>
      )}

      <div>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "10px 22px",
            background: "var(--terracotta)",
            color: "white",
            border: "none",
            borderRadius: 24,
            fontWeight: 600,
            cursor: saving ? "default" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving…" : "Log feeding"}
        </button>
      </div>
    </form>
  );
}
