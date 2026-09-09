"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type Feed = {
  id: string;
  name: string;
  type: string;
  stock_qty: number;
  unit: string;
  cost: number | null;
  restock_threshold: number;
};

const FEED_TYPES: { value: string; label: string }[] = [
  { value: "roughage", label: "Roughage" },
  { value: "concentrate", label: "Concentrate" },
  { value: "lick-mineral", label: "Lick — mineral" },
  { value: "lick-protein", label: "Lick — protein" },
  { value: "lick-production", label: "Lick — production" },
];

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

function pick(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

function num(fd: FormData, key: string): number {
  const n = parseFloat(String(fd.get(key) ?? ""));
  return Number.isFinite(n) ? n : 0;
}

function numOrNull(fd: FormData, key: string): number | null {
  const s = pick(fd, key);
  if (s === null) return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "block" }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

export default function FeedForm({
  farmId,
  feed,
}: {
  farmId: string;
  feed?: Feed;
}) {
  const editing = Boolean(feed);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    const form = e.currentTarget;
    const fd = new FormData(form);

    setSaving(true);
    setError(null);
    setSaved(false);

    const fields = {
      name: String(fd.get("name") ?? "").trim(),
      type: String(fd.get("type") ?? "roughage"),
      stock_qty: num(fd, "stock_qty"),
      unit: pick(fd, "unit") ?? "kg",
      cost: numOrNull(fd, "cost"),
      restock_threshold: num(fd, "restock_threshold"),
    };

    const { error } = editing
      ? await supabase
          .from("feed_inventory")
          .update(fields)
          .eq("id", feed!.id)
          .eq("farm_id", farmId)
      : await supabase.from("feed_inventory").insert({ farm_id: farmId, ...fields });

    if (error) {
      setError(error.message);
      setSaving(false);
      inFlight.current = false;
      return;
    }

    setSaving(false);
    inFlight.current = false;
    if (editing) {
      setSaved(true);
      router.refresh();
    } else {
      form.reset();
      router.refresh();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        border: "1px solid var(--card-border)",
        borderRadius: 8,
        padding: 16,
        background: "var(--light-bg)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
        }}
      >
        <Field label="Name">
          <input
            name="name"
            required
            defaultValue={feed?.name ?? ""}
            style={fieldStyle}
          />
        </Field>

        <Field label="Type">
          <select
            name="type"
            defaultValue={feed?.type ?? "roughage"}
            style={fieldStyle}
          >
            {FEED_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Stock quantity">
          <input
            name="stock_qty"
            type="number"
            step="any"
            min="0"
            defaultValue={feed?.stock_qty ?? 0}
            style={fieldStyle}
          />
        </Field>

        <Field label="Unit">
          <input
            name="unit"
            defaultValue={feed?.unit ?? "kg"}
            style={fieldStyle}
          />
        </Field>

        <Field label="Cost">
          <input
            name="cost"
            type="number"
            step="any"
            min="0"
            defaultValue={feed?.cost ?? ""}
            style={fieldStyle}
          />
        </Field>

        <Field label="Restock threshold">
          <input
            name="restock_threshold"
            type="number"
            step="any"
            min="0"
            defaultValue={feed?.restock_threshold ?? 0}
            style={fieldStyle}
          />
        </Field>
      </div>

      {error && (
        <p style={{ color: "#b3413e", fontSize: 13, marginBottom: 0 }}>{error}</p>
      )}
      {saved && (
        <p style={{ color: "var(--forest)", fontSize: 13, marginBottom: 0 }}>
          Saved.
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        style={{
          marginTop: 16,
          padding: "10px 20px",
          background: "var(--terracotta)",
          color: "white",
          border: "none",
          borderRadius: 24,
          fontWeight: 600,
          cursor: saving ? "default" : "pointer",
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? "Saving…" : editing ? "Save changes" : "Add feed"}
      </button>
    </form>
  );
}
