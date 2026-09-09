import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnimalForm, { type Animal } from "../AnimalForm";
import AnimalTimeline from "../AnimalTimeline";
import RecordSaleForm, { type SaleAnimal } from "../RecordSaleForm";

export default async function AnimalDetailPage({
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
  if (!profile.farm_id) redirect("/animals");

  const [
    { data: animal },
    { data: camps },
    { data: he },
    { data: tx },
    { data: vx },
    { data: sales },
  ] = await Promise.all([
    supabase
      .from("animals")
      .select(
        "id, tag_id, species, breed, dob, sex, camp_id, status, last_mating_date, expected_birth_date"
      )
      .eq("id", id)
      .eq("farm_id", profile.farm_id)
      .single(),
    supabase
      .from("camps")
      .select("id, name")
      .eq("farm_id", profile.farm_id)
      .order("name"),
    supabase
      .from("health_events")
      .select("id, symptoms, notes, status, created_at")
      .eq("animal_id", id)
      .eq("farm_id", profile.farm_id),
    supabase
      .from("treatments")
      .select("id, dosage, administered_at, medicine_inventory(name)")
      .eq("animal_id", id)
      .eq("farm_id", profile.farm_id),
    supabase
      .from("vaccination_records")
      .select("id, administered_at, next_due_date, vaccination_types(name)")
      .eq("animal_id", id)
      .eq("farm_id", profile.farm_id),
    // sales is owner-only via RLS — a worker session just gets an empty list.
    supabase
      .from("sales")
      .select("id, buyer, price, sale_date")
      .eq("animal_id", id)
      .eq("farm_id", profile.farm_id)
      .order("sale_date", { ascending: false }),
  ]);

  if (!animal) notFound();

  const treatments = (tx ?? []).map((t) => ({
    id: t.id as string,
    dosage: t.dosage as string | null,
    administered_at: t.administered_at as string,
    medicine: (t.medicine_inventory as { name?: string } | null)?.name ?? null,
  }));

  const vaccinations = (vx ?? []).map((v) => ({
    id: v.id as string,
    administered_at: v.administered_at as string,
    next_due_date: v.next_due_date as string | null,
    vaccinationType:
      (v.vaccination_types as { name?: string } | null)?.name ?? null,
  }));

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
      <header style={{ marginBottom: 24 }}>
        <Link
          href="/animals"
          style={{
            color: "var(--text-muted)",
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          &larr; All animals
        </Link>
        <h1 style={{ color: "var(--forest)", margin: "8px 0 0" }}>
          {animal.tag_id}
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: 4 }}>
          {animal.species}
          {animal.breed ? ` · ${animal.breed}` : ""} · {animal.status}
        </p>
      </header>

      <AnimalForm
        farmId={profile.farm_id}
        camps={camps ?? []}
        animal={animal as Animal}
      />

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>History</h2>
        <AnimalTimeline
          health={he ?? []}
          treatments={treatments}
          vaccinations={vaccinations}
        />
      </section>

      {profile.role === "owner" && (
        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Sales</h2>
          {sales && sales.length > 0 && (
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px" }}>
              {sales.map((s) => (
                <li
                  key={s.id}
                  style={{
                    border: "1px solid var(--card-border)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    marginBottom: 8,
                    fontSize: 14,
                  }}
                >
                  <strong>{s.buyer ?? "—"}</strong> · {s.price ?? "—"} ·{" "}
                  {s.sale_date}
                </li>
              ))}
            </ul>
          )}
          <RecordSaleForm animal={animal as SaleAnimal} />
        </section>
      )}
    </main>
  );
}
