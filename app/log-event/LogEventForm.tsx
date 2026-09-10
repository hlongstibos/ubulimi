"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import TagInput from "@/app/ui/TagInput";
import DosageGuidance from "@/app/ui/DosageGuidance";

type Animal = {
  id: string;
  tag_id: string;
  species: string;
  estimated_weight_kg: number | null;
};

type Suggestion = {
  id: string;
  name: string;
  treats_conditions: string[];
  stock_qty: number;
  unit: string;
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

export default function LogEventForm({
  animals,
  farmId,
  userId,
  home,
}: {
  animals: Animal[];
  farmId: string;
  userId: string;
  home: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [animalQuery, setAnimalQuery] = useState("");
  const [animalId, setAnimalId] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);

  const [treatment, setTreatment] = useState<{
    medicineId: string;
    doseMl: string;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);

  const selectedAnimal = animals.find((a) => a.id === animalId) ?? null;
  const q = animalQuery.trim().toLowerCase();
  const animalMatches = q
    ? animals.filter((a) => a.tag_id.toLowerCase().includes(q)).slice(0, 8)
    : [];

  // Re-query stock whenever the selected symptoms change.
  useEffect(() => {
    if (symptoms.length === 0) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setSuggestLoading(true);
    supabase
      .from("medicine_inventory")
      .select(
        "id, name, treats_conditions, stock_qty, unit, label_dosage_instructions, dose_per_kg, dose_unit"
      )
      .eq("farm_id", farmId)
      .overlaps("treats_conditions", symptoms)
      .gt("stock_qty", 0)
      .order("name")
      .then(({ data }) => {
        if (cancelled) return;
        setSuggestions((data as Suggestion[] | null) ?? []);
        setSuggestLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [symptoms, farmId, supabase]);

  // Drop a pending treatment if its medicine no longer matches.
  useEffect(() => {
    if (treatment && !suggestions.some((s) => s.id === treatment.medicineId)) {
      setTreatment(null);
    }
  }, [suggestions, treatment]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current) return;

    if (!animalId) {
      setError("Select an animal.");
      return;
    }
    if (symptoms.length === 0 && !notes.trim()) {
      setError("Add at least one symptom or a note.");
      return;
    }
    if (treatment && !(parseFloat(treatment.doseMl) > 0)) {
      setError("Enter a dose in ml greater than 0.");
      return;
    }

    inFlight.current = true;
    setSaving(true);
    setError(null);

    const { data: he, error: heErr } = await supabase
      .from("health_events")
      .insert({
        farm_id: farmId,
        animal_id: animalId,
        logged_by: userId,
        symptoms,
        notes: notes.trim() || null,
        status: "open",
      })
      .select("id")
      .single();

    if (heErr || !he) {
      setError(heErr?.message ?? "Could not save the event.");
      setSaving(false);
      inFlight.current = false;
      return;
    }

    if (treatment) {
      const { error: rpcErr } = await supabase.rpc("administer_treatment", {
        p_animal_id: animalId,
        p_medicine_id: treatment.medicineId,
        p_health_event_id: he.id,
        p_dose_ml: parseFloat(treatment.doseMl),
      });
      if (rpcErr) {
        setError(
          `The health event was saved, but the treatment could not be recorded: ${rpcErr.message}`
        );
        setSaving(false);
        inFlight.current = false;
        return;
      }
    }

    router.push(home);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 22 }}>
      <div>
        <span style={labelStyle}>Animal</span>
        {selectedAnimal ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              border: "1px solid var(--card-border)",
              borderRadius: 6,
              padding: "8px 12px",
              background: "#fff",
            }}
          >
            <strong>{selectedAnimal.tag_id}</strong>
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
              {selectedAnimal.species}
            </span>
            <button
              type="button"
              onClick={() => {
                setAnimalId(null);
                setAnimalQuery("");
              }}
              style={{
                marginLeft: "auto",
                background: "transparent",
                border: "none",
                color: "var(--terracotta)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Change
            </button>
          </div>
        ) : (
          <>
            <input
              value={animalQuery}
              onChange={(e) => setAnimalQuery(e.target.value)}
              placeholder="Search by tag ID"
              style={fieldStyle}
            />
            {animalMatches.length > 0 && (
              <ul
                style={{
                  listStyle: "none",
                  margin: "6px 0 0",
                  padding: 0,
                  border: "1px solid var(--card-border)",
                  borderRadius: 6,
                  overflow: "hidden",
                }}
              >
                {animalMatches.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setAnimalId(a.id)}
                      style={{
                        display: "flex",
                        gap: 8,
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 12px",
                        border: "none",
                        borderBottom: "1px solid var(--card-border)",
                        background: "#fff",
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                    >
                      <strong>{a.tag_id}</strong>
                      <span style={{ color: "var(--text-muted)" }}>
                        {a.species}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {q && animalMatches.length === 0 && (
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: 13,
                  margin: "6px 0 0",
                }}
              >
                No animal with a tag containing “{animalQuery.trim()}”.
              </p>
            )}
          </>
        )}
      </div>

      <div>
        <span style={labelStyle}>Symptoms</span>
        <TagInput value={symptoms} onChange={setSymptoms} />
      </div>

      {symptoms.length > 0 && (
        <div>
          <span style={labelStyle}>Medicine suggestions</span>
          {suggestLoading ? (
            <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>
              Checking stock…
            </p>
          ) : suggestions.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>
              No medicine in stock matches these symptoms.
            </p>
          ) : (
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "grid",
                gap: 10,
              }}
            >
              {suggestions.map((s) => {
                const matched = s.treats_conditions.filter((c) =>
                  symptoms.includes(c)
                );
                const chosen = treatment?.medicineId === s.id;
                return (
                  <li
                    key={s.id}
                    style={{
                      border: "1px solid var(--card-border)",
                      borderLeft: "3px solid var(--moss)",
                      borderRadius: 8,
                      padding: 14,
                      background: "#fff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: 15 }}>{s.name}</strong>
                        <div
                          style={{
                            color: "var(--text-muted)",
                            fontSize: 13,
                            marginTop: 2,
                          }}
                        >
                          Matches: {matched.join(", ")}
                        </div>
                        <div
                          style={{ color: "var(--text-muted)", fontSize: 13 }}
                        >
                          {s.stock_qty} {s.unit} in stock
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          chosen
                            ? setTreatment(null)
                            : setTreatment({ medicineId: s.id, doseMl: "" })
                        }
                        style={{
                          alignSelf: "flex-start",
                          whiteSpace: "nowrap",
                          padding: "6px 14px",
                          borderRadius: 20,
                          border: chosen
                            ? "none"
                            : "1px solid var(--terracotta)",
                          background: chosen ? "var(--terracotta)" : "transparent",
                          color: chosen ? "white" : "var(--terracotta)",
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        {chosen ? "Selected" : "Record treatment"}
                      </button>
                    </div>

                    <DosageGuidance
                      medicineId={s.id}
                      dosePerKg={s.dose_per_kg}
                      doseUnit={s.dose_unit}
                      labelText={s.label_dosage_instructions}
                      weightKg={selectedAnimal?.estimated_weight_kg ?? null}
                      animalId={selectedAnimal?.id ?? null}
                    />

                    {chosen && treatment && (
                      <div style={{ marginTop: 12 }}>
                        <label style={{ display: "block" }}>
                          <span style={labelStyle}>Dose given (ml)</span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={treatment.doseMl}
                            onChange={(e) =>
                              setTreatment({
                                ...treatment,
                                doseMl: e.target.value,
                              })
                            }
                            placeholder="e.g. 20"
                            style={fieldStyle}
                          />
                        </label>
                        <p
                          style={{
                            fontSize: 12,
                            color: "var(--text-muted)",
                            margin: "6px 0 0",
                          }}
                        >
                          Deducted from stock ({s.stock_qty} {s.unit}) — litres
                          reduced by the ml equivalent.
                        </p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <div>
        <span style={labelStyle}>Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          style={{ ...fieldStyle, resize: "vertical" }}
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
          {saving
            ? "Saving…"
            : treatment
              ? "Save event & record treatment"
              : "Save event"}
        </button>
      </div>
    </form>
  );
}

