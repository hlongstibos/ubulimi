import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogVaccinationForm, {
  type VaccinationTypeOption,
} from "./LogVaccinationForm";

export default async function LogVaccinationPage() {
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

  const home = profile.role === "owner" ? "/dashboard" : "/today";

  if (!profile.farm_id) {
    return (
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px" }}>
        <h1 style={{ color: "var(--forest)" }}>Log vaccination</h1>
        <p style={{ color: "var(--text-muted)" }}>
          Your profile isn&rsquo;t linked to a farm yet.
        </p>
      </main>
    );
  }

  const [{ data: animals }, { data: types }] = await Promise.all([
    supabase
      .from("animals")
      .select("id, tag_id, species")
      .eq("farm_id", profile.farm_id)
      .order("tag_id"),
    supabase
      .from("vaccination_types")
      .select(
        "id, name, target_species, linked_medicine_id, linked_medicine:medicine_inventory(name, stock_qty, unit)"
      )
      .eq("farm_id", profile.farm_id)
      .order("name"),
  ]);

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px" }}>
      <header style={{ marginBottom: 24 }}>
        <Link
          href={home}
          style={{
            color: "var(--text-muted)",
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          &larr; Back
        </Link>
        <h1 style={{ color: "var(--forest)", margin: "8px 0 0" }}>
          Log vaccination
        </h1>
      </header>

      <LogVaccinationForm
        animals={animals ?? []}
        types={(types ?? []) as unknown as VaccinationTypeOption[]}
        home={home}
      />
    </main>
  );
}
