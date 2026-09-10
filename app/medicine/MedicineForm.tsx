"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import TagInput from "@/app/ui/TagInput";

export type Medicine = {
  id: string;
  name: string;
  type: string;
  treats_conditions: string[];
  stock_qty: number;
  unit: string;
  expiry_date: string | null;
  restock_threshold: number;
  label_dosage_instructions: string | null;
  dose_per_kg: number | null;
  dose_unit: string | null;
};

export type MedicineCost = {
  cost: number | null;
  supplier: string | null;
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

export default function MedicineForm({
  farmId,
  role,
  medicine,
  cost,
}: {
  farmId: string;
  role: string;
  medicine?: Medicine;
  cost?: MedicineCost | null;
}) {
  const editing = Boolean(medicine);
  const isOwner = role === "owner";
  const [conditions, setConditions] = useState<string[]>(
    medicine?.treats_conditions ?? []
  );
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
      type: String(fd.get("type") ?? "treatment"),
      treats_conditions: conditions,
      stock_qty: num(fd, "stock_qty"),
      unit: pick(fd, "unit") ?? "units",
      expiry_date: pick(fd, "expiry_date"),
      restock_threshold: num(fd, "restock_threshold"),
      label_dosage_instructions: pick(fd, "label_dosage_instructions"),
      dose_per_kg: numOrNull(fd, "dose_per_kg"),
      dose_unit: pick(fd, "dose_unit"),
    };

    try {
      let medicineId = medicine?.id;

      if (editing) {
        const { error } = await supabase
          .from("medicine_inventory")
          .update(fields)
          .eq("id", medicine!.id)
          .eq("farm_id", farmId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("medicine_inventory")
          .insert({ farm_id: farmId, ...fields })
          .select("id")
          .single();
        if (error) throw error;
        medicineId = data.id as string;
      }

      // Cost/supplier is a separate, owner-only table. A worker session
      // never reaches this branch and never names medicine_costs.
      if (isOwner && medicineId) {
        const costVal = pick(fd, "cost");
        const supplierVal = pick(fd, "supplier");
        if (costVal !== null || supplierVal !== null || cost != null) {
          const { error } = await supabase.from("medicine_costs").upsert({
            medicine_id: medicineId,
            cost: costVal === null ? null : Number(costVal),
            supplier: supplierVal,
          });
          if (error) throw error;
        }
      }
    } catch (err) {
      const msg =
        (err as { message?: string })?.message ?? "Could not save. Try again.";
      setError(msg);
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
      setConditions([]);
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
        background: "#fff",
        boxShadow: "var(--card-shadow)",
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
            defaultValue={medicine?.name ?? ""}
            style={fieldStyle}
          />
        </Field>

        <Field label="Type">
          <select
            name="type"
            defaultValue={medicine?.type ?? "treatment"}
            style={fieldStyle}
          >
            <option value="treatment">Treatment</option>
            <option value="vaccine">Vaccine</option>
          </select>
        </Field>

        <Field label="Stock quantity">
          <input
            name="stock_qty"
            type="number"
            step="any"
            min="0"
            defaultValue={medicine?.stock_qty ?? 0}
            style={fieldStyle}
          />
        </Field>

        <Field label="Unit">
          <input
            name="unit"
            list="med-unit-options"
            defaultValue={medicine?.unit ?? "ml"}
            style={fieldStyle}
          />
          <datalist id="med-unit-options">
            {["ml", "L", "bottles", "vials", "doses", "sachets", "tablets", "tubes", "units"].map(
              (u) => (
                <option key={u} value={u} />
              )
            )}
          </datalist>
        </Field>

        <Field label="Restock threshold">
          <input
            name="restock_threshold"
            type="number"
            step="any"
            min="0"
            defaultValue={medicine?.restock_threshold ?? 0}
            style={fieldStyle}
          />
        </Field>

        <Field label="Expiry date">
          <input
            name="expiry_date"
            type="date"
            defaultValue={medicine?.expiry_date ?? ""}
            style={fieldStyle}
          />
        </Field>
      </div>

      <p
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          margin: "8px 0 0",
        }}
      >
        For injectables and liquids use <strong>ml</strong> or <strong>L</strong>.
        Treatment doses are entered in ml and deducted from stock; if stock is in
        L it is reduced by the ml equivalent.
      </p>

      <div
        style={{
          borderTop: "1px solid var(--card-border)",
          marginTop: 18,
          paddingTop: 14,
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>
          Dosing — copy from the label
        </p>
        <p
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            margin: "0 0 12px",
            lineHeight: 1.5,
          }}
        >
          Transcribe these fields word-for-word from the physical product label
          or the package insert. This is a reference record of what the
          manufacturer states &mdash; do not estimate, round, or fill them from
          memory. Leave a field blank if the label doesn&rsquo;t give it.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 14,
          }}
        >
          <Field label="Dose per kg (as printed)">
            <input
              name="dose_per_kg"
              type="number"
              step="any"
              min="0"
              defaultValue={medicine?.dose_per_kg ?? ""}
              placeholder="blank if not stated on the label"
              style={fieldStyle}
            />
          </Field>
          <Field label="Dose unit (as printed)">
            <input
              name="dose_unit"
              list="dose-unit-options"
              defaultValue={medicine?.dose_unit ?? ""}
              placeholder="e.g. ml, mg, tablet"
              style={fieldStyle}
            />
            <datalist id="dose-unit-options">
              {["ml", "mg", "g", "IU", "tablet", "sachet"].map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </Field>
        </div>
        <div style={{ marginTop: 14 }}>
          <Field label="Label dosage instructions (verbatim)">
            <textarea
              name="label_dosage_instructions"
              rows={3}
              defaultValue={medicine?.label_dosage_instructions ?? ""}
              placeholder="Type the dosing text exactly as it appears on the label / insert"
              style={{ ...fieldStyle, resize: "vertical" }}
            />
          </Field>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <Field label="Treats conditions">
          <TagInput value={conditions} onChange={setConditions} />
        </Field>
      </div>

      {isOwner && (
        <div
          style={{
            borderTop: "1px solid var(--card-border)",
            marginTop: 18,
            paddingTop: 14,
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              margin: "0 0 12px",
            }}
          >
            Cost &amp; supplier &middot; visible to owners only
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 14,
            }}
          >
            <Field label="Cost">
              <input
                name="cost"
                type="number"
                step="any"
                min="0"
                defaultValue={cost?.cost ?? ""}
                style={fieldStyle}
              />
            </Field>
            <Field label="Supplier">
              <input
                name="supplier"
                defaultValue={cost?.supplier ?? ""}
                style={fieldStyle}
              />
            </Field>
          </div>
        </div>
      )}

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
        {saving ? "Saving…" : editing ? "Save changes" : "Add medicine"}
      </button>
    </form>
  );
}
