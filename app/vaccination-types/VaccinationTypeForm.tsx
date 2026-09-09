"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import TagInput from "@/app/ui/TagInput";

export type VaccinationType = {
  id: string;
  name: string;
  target_species: string[];
  linked_medicine_id: string | null;
  initial_dose_age_days: number | null;
  booster_interval_days: number | null;
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

function intOrNull(fd: FormData, key: string): number | null {
  const n = parseInt(String(fd.get(key) ?? ""), 10);
  return Number.isFinite(n) ? n : null;
}

function strOrNull(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
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

export default function VaccinationTypeForm({
  farmId,
  medicines,
  type,
}: {
  farmId: string;
  medicines: { id: string; name: string }[];
  type?: VaccinationType;
}) {
  const editing = Boolean(type);
  const [species, setSpecies] = useState<string[]>(type?.target_species ?? []);
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
      target_species: species,
      linked_medicine_id: strOrNull(fd, "linked_medicine_id"),
      initial_dose_age_days: intOrNull(fd, "initial_dose_age_days"),
      booster_interval_days: intOrNull(fd, "booster_interval_days"),
    };

    const { error } = editing
      ? await supabase
          .from("vaccination_types")
          .update(fields)
          .eq("id", type!.id)
          .eq("farm_id", farmId)
      : await supabase
          .from("vaccination_types")
          .insert({ farm_id: farmId, ...fields });

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
      setSpecies([]);
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
            defaultValue={type?.name ?? ""}
            style={fieldStyle}
          />
        </Field>

        <Field label="Linked medicine">
          <select
            name="linked_medicine_id"
            defaultValue={type?.linked_medicine_id ?? ""}
            style={fieldStyle}
          >
            <option value="">None (no stock deduction)</option>
            {medicines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Initial dose age (days)">
          <input
            name="initial_dose_age_days"
            type="number"
            min="0"
            step="1"
            defaultValue={type?.initial_dose_age_days ?? ""}
            style={fieldStyle}
          />
        </Field>

        <Field label="Booster interval (days)">
          <input
            name="booster_interval_days"
            type="number"
            min="0"
            step="1"
            defaultValue={type?.booster_interval_days ?? ""}
            style={fieldStyle}
          />
        </Field>
      </div>

      <div style={{ marginTop: 14 }}>
        <Field label="Target species">
          <TagInput value={species} onChange={setSpecies} />
        </Field>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "6px 0 0" }}>
          A type with no species listed never applies to any animal.
        </p>
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
        {saving ? "Saving…" : editing ? "Save changes" : "Add vaccination type"}
      </button>
    </form>
  );
}
