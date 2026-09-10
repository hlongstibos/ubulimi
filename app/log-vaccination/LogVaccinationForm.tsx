"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AnimalPicker, { type PickableAnimal } from "@/app/ui/AnimalPicker";

export type VaccinationTypeOption = {
  id: string;
  name: string;
  target_species: string[];
  linked_medicine_id: string | null;
  linked_medicine: { name: string; stock_qty: number; unit: string } | null;
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

export default function LogVaccinationForm({
  animals,
  types,
  home,
  initialAnimalId = null,
  initialTypeId = "",
}: {
  animals: PickableAnimal[];
  types: VaccinationTypeOption[];
  home: string;
  initialAnimalId?: string | null;
  initialTypeId?: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [animalId, setAnimalId] = useState<string | null>(
    initialAnimalId && animals.some((a) => a.id === initialAnimalId)
      ? initialAnimalId
      : null
  );
  const [typeId, setTypeId] = useState(initialTypeId);
  const [doses, setDoses] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);

  const selectedAnimal = animals.find((a) => a.id === animalId) ?? null;
  const applicableTypes = selectedAnimal
    ? types.filter((t) => t.target_species.includes(selectedAnimal.species))
    : [];
  const selectedType = applicableTypes.find((t) => t.id === typeId) ?? null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current) return;

    if (!animalId) {
      setError("Select an animal.");
      return;
    }
    if (!selectedType) {
      setError("Select a vaccination type.");
      return;
    }
    if (selectedType.linked_medicine_id && !(parseFloat(doses) > 0)) {
      setError("Enter a dose count greater than 0.");
      return;
    }

    inFlight.current = true;
    setSaving(true);
    setError(null);

    const { error: rpcErr } = await supabase.rpc("administer_vaccination", {
      p_animal_id: animalId,
      p_vaccination_type_id: selectedType.id,
      p_quantity: selectedType.linked_medicine_id ? parseFloat(doses) : 1,
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
        <span style={labelStyle}>Animal</span>
        <AnimalPicker
          animals={animals}
          value={animalId}
          onChange={(id) => {
            setAnimalId(id);
            setTypeId("");
          }}
        />
      </div>

      <div>
        <span style={labelStyle}>Vaccination type</span>
        {!selectedAnimal ? (
          <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>
            Select an animal first.
          </p>
        ) : applicableTypes.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>
            No vaccination type targets {selectedAnimal.species}.
          </p>
        ) : (
          <select
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
            style={fieldStyle}
          >
            <option value="">Choose a type…</option>
            {applicableTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedType && selectedType.linked_medicine_id && (
        <div>
          <span style={labelStyle}>
            Doses to deduct from{" "}
            {selectedType.linked_medicine?.name ?? "the linked medicine"}
            {selectedType.linked_medicine
              ? ` (${selectedType.linked_medicine.stock_qty} ${selectedType.linked_medicine.unit} in stock)`
              : ""}
          </span>
          <input
            type="number"
            step="any"
            min="0"
            value={doses}
            onChange={(e) => setDoses(e.target.value)}
            style={fieldStyle}
          />
        </div>
      )}

      {selectedType && !selectedType.linked_medicine_id && (
        <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>
          This type has no linked medicine — stock won&rsquo;t change.
        </p>
      )}

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
          {saving ? "Saving…" : "Log vaccination"}
        </button>
      </div>
    </form>
  );
}
