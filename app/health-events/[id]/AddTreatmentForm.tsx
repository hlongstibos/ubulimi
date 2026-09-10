"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DosageGuidance from "@/app/ui/DosageGuidance";

export type PickMedicine = {
  id: string;
  name: string;
  unit: string;
  stock_qty: number;
  label_dosage_instructions: string | null;
  dose_per_kg: number | null;
  dose_unit: string | null;
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

export default function AddTreatmentForm({
  healthEventId,
  animalId,
  animalWeightKg,
  medicines,
}: {
  healthEventId: string;
  animalId: string;
  animalWeightKg: number | null;
  medicines: PickMedicine[];
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [medicineId, setMedicineId] = useState("");
  const [doseMl, setDoseMl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);

  const selected = medicines.find((m) => m.id === medicineId) ?? null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current) return;

    if (!medicineId) {
      setError("Choose a medicine.");
      return;
    }
    if (!(parseFloat(doseMl) > 0)) {
      setError("Enter a dose in ml greater than 0.");
      return;
    }

    inFlight.current = true;
    setSaving(true);
    setError(null);

    const { error: rpcErr } = await supabase.rpc("administer_treatment", {
      p_animal_id: animalId,
      p_medicine_id: medicineId,
      p_health_event_id: healthEventId,
      p_dose_ml: parseFloat(doseMl),
    });

    if (rpcErr) {
      setError(rpcErr.message);
      setSaving(false);
      inFlight.current = false;
      return;
    }

    setSaving(false);
    inFlight.current = false;
    setMedicineId("");
    setDoseMl("");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card"
      style={{ padding: 16, display: "grid", gap: 14 }}
    >
      <label style={{ display: "block" }}>
        <span style={labelStyle}>Medicine</span>
        <select
          value={medicineId}
          onChange={(e) => setMedicineId(e.target.value)}
          style={fieldStyle}
        >
          <option value="">Choose a medicine…</option>
          {medicines.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} — {m.stock_qty} {m.unit}
            </option>
          ))}
        </select>
      </label>

      {selected && (
        <DosageGuidance
          medicineId={selected.id}
          dosePerKg={selected.dose_per_kg}
          doseUnit={selected.dose_unit}
          labelText={selected.label_dosage_instructions}
          weightKg={animalWeightKg}
          animalId={animalId}
        />
      )}

      <label style={{ display: "block" }}>
        <span style={labelStyle}>Dose given (ml)</span>
        <input
          type="number"
          step="any"
          min="0"
          value={doseMl}
          onChange={(e) => setDoseMl(e.target.value)}
          placeholder="e.g. 20"
          style={fieldStyle}
        />
        {selected && (
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Deducted from {selected.name} stock ({selected.stock_qty}{" "}
            {selected.unit}) — litres reduced by the ml equivalent.
          </span>
        )}
      </label>

      {error && (
        <p style={{ color: "#b3413e", fontSize: 13, margin: 0 }}>{error}</p>
      )}

      <div>
        <button
          type="submit"
          disabled={saving}
          style={{
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
          {saving ? "Recording…" : "Record treatment"}
        </button>
      </div>
    </form>
  );
}
