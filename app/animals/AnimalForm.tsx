"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type Animal = {
  id: string;
  tag_id: string;
  species: string;
  breed: string | null;
  dob: string | null;
  sex: string | null;
  camp_id: string | null;
  status: string;
  last_mating_date: string | null;
  expected_birth_date: string | null;
  estimated_weight_kg: number | null;
};

type Camp = { id: string; name: string };

const DEFAULT_SPECIES = [
  "Cattle",
  "Goat",
  "Sheep",
  "Pig",
  "Chicken",
  "Horse",
];
const DEFAULT_BREEDS = [
  "Boer",
  "Kalahari Red",
  "Savanna",
  "Nguni",
  "Bonsmara",
  "Brahman",
  "Afrikaner",
  "Dorper",
  "Meatmaster",
  "Merino",
  "Damara",
];

function merged(base: string[], extra: string[] = []): string[] {
  return Array.from(new Set([...extra, ...base].filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}

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

export default function AnimalForm({
  farmId,
  camps,
  animal,
  speciesOptions = [],
  breedOptions = [],
}: {
  farmId: string;
  camps: Camp[];
  animal?: Animal;
  speciesOptions?: string[];
  breedOptions?: string[];
}) {
  const editing = Boolean(animal);
  const speciesList = merged(DEFAULT_SPECIES, speciesOptions);
  const breedList = merged(DEFAULT_BREEDS, breedOptions);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const tagId = String(fd.get("tag_id") ?? "").trim();

    setSaving(true);
    setError(null);
    setSaved(false);

    const fields = {
      tag_id: tagId,
      species: String(fd.get("species") ?? "").trim(),
      breed: pick(fd, "breed"),
      dob: pick(fd, "dob"),
      sex: pick(fd, "sex"),
      camp_id: pick(fd, "camp_id"),
      last_mating_date: pick(fd, "last_mating_date"),
      expected_birth_date: pick(fd, "expected_birth_date"),
      estimated_weight_kg: numOrNull(fd, "estimated_weight_kg"),
    };

    const { error } = editing
      ? await supabase
          .from("animals")
          .update({ ...fields, status: String(fd.get("status") ?? "active") })
          .eq("id", animal!.id)
          .eq("farm_id", farmId)
      : await supabase.from("animals").insert({ farm_id: farmId, ...fields });

    if (error) {
      setError(
        error.code === "23505"
          ? `An animal with tag ID “${tagId}” already exists on this farm.`
          : error.message
      );
      setSaving(false);
      return;
    }

    setSaving(false);
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
        borderRadius: 12,
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
        <Field label="Tag ID">
          <input
            name="tag_id"
            required
            defaultValue={animal?.tag_id ?? ""}
            style={fieldStyle}
          />
        </Field>

        <Field label="Species">
          <input
            name="species"
            required
            list="species-options"
            defaultValue={animal?.species ?? ""}
            placeholder="Type or pick"
            style={fieldStyle}
          />
          <datalist id="species-options">
            {speciesList.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>

        <Field label="Breed">
          <input
            name="breed"
            list="breed-options"
            defaultValue={animal?.breed ?? ""}
            placeholder="Type or pick"
            style={fieldStyle}
          />
          <datalist id="breed-options">
            {breedList.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </Field>

        <Field label="Date of birth">
          <input
            name="dob"
            type="date"
            defaultValue={animal?.dob ?? ""}
            style={fieldStyle}
          />
        </Field>

        <Field label="Sex">
          <select name="sex" defaultValue={animal?.sex ?? ""} style={fieldStyle}>
            <option value="">Unknown</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </Field>

        <Field label="Camp">
          <select
            name="camp_id"
            defaultValue={animal?.camp_id ?? ""}
            style={fieldStyle}
          >
            <option value="">No camp</option>
            {camps.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Last mating date">
          <input
            name="last_mating_date"
            type="date"
            defaultValue={animal?.last_mating_date ?? ""}
            style={fieldStyle}
          />
        </Field>

        <Field label="Expected birth date">
          <input
            name="expected_birth_date"
            type="date"
            defaultValue={animal?.expected_birth_date ?? ""}
            style={fieldStyle}
          />
        </Field>

        <Field label="Estimated weight (kg) — your estimate">
          <input
            name="estimated_weight_kg"
            type="number"
            step="any"
            min="0"
            defaultValue={animal?.estimated_weight_kg ?? ""}
            placeholder="your best estimate, in kg"
            style={fieldStyle}
          />
        </Field>

        {editing && (
          <Field label="Status">
            <select
              name="status"
              defaultValue={animal?.status ?? "active"}
              style={fieldStyle}
            >
              <option value="active">Active</option>
              <option value="sold">Sold</option>
              <option value="deceased">Deceased</option>
              <option value="culled">Culled</option>
            </select>
          </Field>
        )}
      </div>

      <p
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          margin: "10px 0 0",
          lineHeight: 1.5,
        }}
      >
        Estimated weight is a figure <strong>you</strong> set and update by hand
        &mdash; after a weigh, a condition score, or a rough eye estimate. V1
        keeps only the latest value; it does not track weight over time.
      </p>

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
        {saving
          ? "Saving…"
          : editing
            ? "Save changes"
            : "Add animal"}
      </button>
    </form>
  );
}
