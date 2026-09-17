import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VaccinationsDueList, type DueRow } from "@/app/ui/VaccinationsDue";

export default async function VaccinationsPage() {
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
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px 48px" }}>
        <h1 style={{ color: "var(--forest)" }}>Vaccinations</h1>
        <p style={{ color: "var(--text-muted)" }}>
          Your profile isn&rsquo;t linked to a farm yet.
        </p>
      </main>
    );
  }

  const { data: vaccinationsDue } = await supabase
    .from("vaccinations_due")
    .select(
      "animal_id, tag_id, species, vaccination_type_id, vaccination_type_name, reason, due_date"
    )
    .eq("farm_id", profile.farm_id)
    .order("due_date", { ascending: true, nullsFirst: true });

  const due = (vaccinationsDue ?? []) as DueRow[];

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px 48px" }}>
      <header
        style={{
          marginBottom: 20,
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
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
          <h1
            style={{
              color: "var(--forest)",
              fontSize: 24,
              fontWeight: 800,
              margin: "8px 0 0",
            }}
          >
            Vaccinations
          </h1>
          <p style={{ color: "var(--text-muted)", margin: "4px 0 0", fontSize: 14 }}>
            Due and overdue across the farm — click an animal to log its dose.
          </p>
        </div>

        {profile.role === "owner" && (
          <Link
            href="/vaccination-types"
            style={{
              padding: "7px 14px",
              borderRadius: 999,
              border: "1px solid var(--forest)",
              background: "transparent",
              color: "var(--forest)",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Set up vaccination types
          </Link>
        )}
      </header>

      <section>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>
          Due &amp; overdue ({due.length})
        </h2>
        <VaccinationsDueList rows={due} />
      </section>
    </main>
  );
}
