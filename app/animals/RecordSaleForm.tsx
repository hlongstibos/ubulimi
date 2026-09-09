"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type SaleAnimal = {
  id: string;
  tag_id: string;
  species: string;
  breed: string | null;
  dob: string | null;
  sex: string | null;
  status: string;
};

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

export default function RecordSaleForm({
  animal,
  farmId,
}: {
  animal: SaleAnimal;
  farmId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const today = new Date().toISOString().slice(0, 10);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current) return;

    const form = e.currentTarget;
    const fd = new FormData(form);
    const buyer = String(fd.get("buyer") ?? "").trim();
    const priceRaw = String(fd.get("price") ?? "").trim();
    const saleDate = String(fd.get("sale_date") ?? "").trim();
    const price = parseFloat(priceRaw);

    if (!buyer) {
      setError("Enter a buyer.");
      return;
    }
    if (priceRaw === "" || !(price >= 0)) {
      setError("Enter a price of 0 or more.");
      return;
    }
    if (!saleDate) {
      setError("Enter a sale date.");
      return;
    }

    inFlight.current = true;
    setSaving(true);
    setError(null);
    setDone(false);

    // Capture the animal's full history now so the sale record stays
    // accurate even if these rows change later.
    const [heRes, txRes, vxRes] = await Promise.all([
      supabase
        .from("health_events")
        .select("id, symptoms, notes, status, created_at")
        .eq("animal_id", animal.id)
        .order("created_at"),
      supabase
        .from("treatments")
        .select("id, dosage, administered_at, medicine_inventory(name)")
        .eq("animal_id", animal.id)
        .order("administered_at"),
      supabase
        .from("vaccination_records")
        .select("id, administered_at, next_due_date, vaccination_types(name)")
        .eq("animal_id", animal.id)
        .order("administered_at"),
    ]);

    if (heRes.error || txRes.error || vxRes.error) {
      setError("Could not read the animal's history — nothing was saved. Try again.");
      setSaving(false);
      inFlight.current = false;
      return;
    }

    const historySnapshot = {
      captured_at: new Date().toISOString(),
      animal: {
        id: animal.id,
        tag_id: animal.tag_id,
        species: animal.species,
        breed: animal.breed,
        dob: animal.dob,
        sex: animal.sex,
        status: animal.status,
      },
      health_events: (heRes.data ?? []).map((h) => ({
        id: h.id,
        symptoms: h.symptoms,
        notes: h.notes,
        status: h.status,
        created_at: h.created_at,
      })),
      treatments: (txRes.data ?? []).map((t) => ({
        id: t.id,
        dosage: t.dosage,
        administered_at: t.administered_at,
        medicine:
          (t.medicine_inventory as { name?: string } | null)?.name ?? null,
      })),
      vaccination_records: (vxRes.data ?? []).map((v) => ({
        id: v.id,
        administered_at: v.administered_at,
        next_due_date: v.next_due_date,
        vaccination_type:
          (v.vaccination_types as { name?: string } | null)?.name ?? null,
      })),
    };

    const { error: insErr } = await supabase.from("sales").insert({
      farm_id: farmId,
      animal_id: animal.id,
      buyer,
      price,
      sale_date: saleDate,
      history_snapshot: historySnapshot,
    });

    if (insErr) {
      setError(insErr.message);
      setSaving(false);
      inFlight.current = false;
      return;
    }

    setSaving(false);
    inFlight.current = false;
    setDone(true);
    form.reset();
    router.refresh();
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
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
        }}
      >
        <label style={{ display: "block" }}>
          <span style={labelStyle}>Buyer</span>
          <input name="buyer" required style={fieldStyle} />
        </label>
        <label style={{ display: "block" }}>
          <span style={labelStyle}>Price</span>
          <input
            name="price"
            type="number"
            step="any"
            min="0"
            required
            style={fieldStyle}
          />
        </label>
        <label style={{ display: "block" }}>
          <span style={labelStyle}>Sale date</span>
          <input
            name="sale_date"
            type="date"
            defaultValue={today}
            required
            style={fieldStyle}
          />
        </label>
      </div>

      {error && (
        <p style={{ color: "#b3413e", fontSize: 13, marginBottom: 0 }}>{error}</p>
      )}
      {done && (
        <p style={{ color: "var(--forest)", fontSize: 13, marginBottom: 0 }}>
          Sale recorded.
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
        {saving ? "Recording…" : "Record sale"}
      </button>
    </form>
  );
}
