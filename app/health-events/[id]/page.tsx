import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HealthEventStatus from "./HealthEventStatus";
import AddTreatmentForm, { type PickMedicine } from "./AddTreatmentForm";

export default async function HealthEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, farm_id")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");
  if (!profile.farm_id) redirect("/dashboard");

  const [{ data: event }, { data: treatments }, { data: medicines }] =
    await Promise.all([
      supabase
        .from("health_events")
        .select(
          "id, symptoms, notes, status, created_at, animal_id, animals(tag_id, species, estimated_weight_kg)"
        )
        .eq("id", id)
        .eq("farm_id", profile.farm_id)
        .single(),
      supabase
        .from("treatments")
        .select("id, dosage, dose_ml, administered_at, medicine_inventory(name)")
        .eq("health_event_id", id)
        .eq("farm_id", profile.farm_id)
        .order("administered_at", { ascending: false }),
      supabase
        .from("medicine_inventory")
        .select(
          "id, name, unit, stock_qty, label_dosage_instructions, dose_per_kg, dose_unit"
        )
        .eq("farm_id", profile.farm_id)
        .order("name"),
    ]);

  if (!event) notFound();

  const animal = event.animals as {
    tag_id?: string;
    species?: string;
    estimated_weight_kg?: number | null;
  } | null;

  const tx = (treatments ?? []).map((t) => ({
    id: t.id as string,
    dose_ml: t.dose_ml as number | null,
    dosage: t.dosage as string | null,
    administered_at: t.administered_at as string,
    medicine:
      (t.medicine_inventory as { name?: string } | null)?.name ??
      "Unknown medicine",
  }));

  const symptoms = (event.symptoms ?? []) as string[];
  const resolved = event.status === "resolved";
  const statusLabel = resolved
    ? "Resolved"
    : tx.length > 0
      ? "Open · being treated"
      : "Open";

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px 48px" }}>
      <header style={{ marginBottom: 18 }}>
        <Link
          href={`/animals/${event.animal_id}`}
          style={{
            color: "var(--text-muted)",
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          &larr; {animal?.tag_id ?? "Animal"}
        </Link>
        <h1
          style={{
            color: "var(--forest)",
            fontSize: 24,
            fontWeight: 800,
            margin: "8px 0 0",
          }}
        >
          Health event
        </h1>
        <p style={{ color: "var(--text-muted)", margin: "4px 0 0", fontSize: 14 }}>
          <Link
            href={`/animals/${event.animal_id}`}
            style={{
              color: "var(--forest)",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            {animal?.tag_id ?? "—"}
          </Link>{" "}
          {animal?.species ? `· ${animal.species} ` : ""}·{" "}
          {String(event.created_at).slice(0, 10)}
        </p>
      </header>

      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              color: resolved ? "var(--forest)" : "var(--terracotta)",
            }}
          >
            {statusLabel}
          </span>
          <HealthEventStatus eventId={event.id} status={event.status} />
        </div>

        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Symptoms</div>
        {symptoms.length === 0 ? (
          <p style={{ margin: "2px 0 10px" }}>—</p>
        ) : (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              margin: "4px 0 10px",
            }}
          >
            {symptoms.map((c) => (
              <span
                key={c}
                style={{
                  background: "var(--moss)",
                  color: "white",
                  borderRadius: 12,
                  padding: "2px 8px",
                  fontSize: 12,
                }}
              >
                {c}
              </span>
            ))}
          </div>
        )}

        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Notes</div>
        <p style={{ margin: "2px 0 0", whiteSpace: "pre-wrap" }}>
          {event.notes ?? "—"}
        </p>
      </div>

      <h2 style={{ fontSize: 16, marginBottom: 10 }}>Treatments given</h2>
      {tx.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>
          No medicine recorded for this event yet.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {tx.map((t) => (
            <li
              key={t.id}
              style={{
                border: "1px solid var(--card-border)",
                borderLeft: "3px solid var(--moss)",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 8,
                background: "#fff",
                fontSize: 14,
              }}
            >
              <strong>{t.medicine}</strong>
              {t.dose_ml != null ? ` · ${t.dose_ml} ml` : t.dosage ? ` · ${t.dosage}` : ""}
              <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                {" "}
                · {t.administered_at.slice(0, 10)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ fontSize: 16, margin: "22px 0 10px" }}>Record a treatment</h2>
      <AddTreatmentForm
        healthEventId={event.id}
        animalId={event.animal_id}
        animalWeightKg={animal?.estimated_weight_kg ?? null}
        medicines={(medicines ?? []) as unknown as PickMedicine[]}
      />
    </main>
  );
}
