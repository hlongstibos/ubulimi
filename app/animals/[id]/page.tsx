import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Collapsible from "@/app/ui/Collapsible";
import AnimalForm, { type Animal } from "../AnimalForm";
import AnimalTimeline from "../AnimalTimeline";
import RecordSaleForm, { type SaleAnimal } from "../RecordSaleForm";
import DownloadReport from "../DownloadReport";
import type { ReportData } from "../animalReport";

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
    { data: farm },
    { data: allForOptions },
    { data: farmBuyers },
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
    supabase
      .from("farms")
      .select("name")
      .eq("id", profile.farm_id)
      .single(),
    supabase
      .from("animals")
      .select("species, breed")
      .eq("farm_id", profile.farm_id),
    supabase.from("sales").select("buyer").eq("farm_id", profile.farm_id),
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

  const animalSales = sales ?? [];
  const latestSale =
    animal.status === "sold" && animalSales.length > 0 ? animalSales[0] : null;

  const historyCount =
    (he?.length ?? 0) + treatments.length + vaccinations.length;

  const uniq = (xs: (string | null)[]) =>
    Array.from(new Set(xs.filter((x): x is string => Boolean(x))));

  const speciesOptions = uniq((allForOptions ?? []).map((a) => a.species));
  const breedOptions = uniq((allForOptions ?? []).map((a) => a.breed));
  const buyerOptions = uniq((farmBuyers ?? []).map((s) => s.buyer));

  const reportData: ReportData = {
    farmName: (farm as { name?: string } | null)?.name ?? null,
    generatedAt: new Date().toISOString(),
    animal: {
      tag_id: animal.tag_id,
      species: animal.species,
      breed: animal.breed,
      sex: animal.sex,
      dob: animal.dob,
      status: animal.status,
    },
    vaccinations,
    treatments,
    sale: latestSale
      ? {
          buyer: latestSale.buyer,
          price: latestSale.price as number | null,
          sale_date: latestSale.sale_date,
        }
      : null,
  };

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px 48px" }}>
      <header style={{ marginBottom: 20 }}>
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
        <h1
          style={{
            color: "var(--forest)",
            fontSize: 24,
            fontWeight: 800,
            margin: "8px 0 0",
          }}
        >
          {animal.tag_id}
        </h1>
        <p style={{ color: "var(--text-muted)", margin: "4px 0 0" }}>
          {animal.species}
          {animal.breed ? ` · ${animal.breed}` : ""} · {animal.status}
        </p>
      </header>

      <AnimalForm
        farmId={profile.farm_id}
        camps={camps ?? []}
        animal={animal as Animal}
        speciesOptions={speciesOptions}
        breedOptions={breedOptions}
      />

      <section style={{ marginTop: 26 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 10,
          }}
        >
          <h2 style={{ fontSize: 16, margin: 0 }}>History</h2>
          <DownloadReport data={reportData} />
        </div>
        <Collapsible title="Full history" count={historyCount}>
          <AnimalTimeline
            health={he ?? []}
            treatments={treatments}
            vaccinations={vaccinations}
          />
        </Collapsible>
      </section>

      {profile.role === "owner" && (
        <section style={{ marginTop: 26 }}>
          <h2 style={{ fontSize: 16, marginBottom: 10 }}>Sales</h2>
          {animalSales.length > 0 && (
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 14px" }}>
              {animalSales.map((s) => (
                <li
                  key={s.id}
                  style={{
                    border: "1px solid var(--card-border)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    marginBottom: 8,
                    fontSize: 14,
                    background: "#fff",
                    boxShadow: "var(--card-shadow)",
                  }}
                >
                  <strong>{s.buyer ?? "—"}</strong> · R {s.price ?? "—"} ·{" "}
                  {s.sale_date}
                </li>
              ))}
            </ul>
          )}
          <RecordSaleForm
            animal={animal as SaleAnimal}
            buyerOptions={buyerOptions}
          />
        </section>
      )}
    </main>
  );
}
