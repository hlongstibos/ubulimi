import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VaccinationTypeForm, { type VaccinationType } from "../VaccinationTypeForm";

export default async function VaccinationTypeDetailPage({
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
  if (profile.role !== "owner") redirect("/today");
  if (!profile.farm_id) redirect("/vaccination-types");

  const [{ data: type }, { data: medicines }] = await Promise.all([
    supabase
      .from("vaccination_types")
      .select(
        "id, name, target_species, linked_medicine_id, initial_dose_age_days, booster_interval_days"
      )
      .eq("id", id)
      .eq("farm_id", profile.farm_id)
      .single(),
    supabase
      .from("medicine_inventory")
      .select("id, name")
      .eq("farm_id", profile.farm_id)
      .order("name"),
  ]);

  if (!type) notFound();

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
      <header style={{ marginBottom: 24 }}>
        <Link
          href="/vaccination-types"
          style={{
            color: "var(--text-muted)",
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          &larr; All vaccination types
        </Link>
        <h1 style={{ color: "var(--forest)", margin: "8px 0 0" }}>{type.name}</h1>
      </header>

      <VaccinationTypeForm
        farmId={profile.farm_id}
        medicines={medicines ?? []}
        type={type as VaccinationType}
      />
    </main>
  );
}
