import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/app/ui/Nav";
import Collapsible from "@/app/ui/Collapsible";
import VaccinationsDue, { type DueRow } from "@/app/ui/VaccinationsDue";

const ON_FARM = ["active"];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, farm_id, full_name")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");
  if (profile.role !== "owner") redirect("/today");

  const { data: farm } = await supabase
    .from("farms")
    .select("name")
    .eq("id", profile.farm_id)
    .single();

  // "Animals on farm" excludes sold / deceased / culled.
  const { count: animalCount } = await supabase
    .from("animals")
    .select("*", { count: "exact", head: true })
    .eq("farm_id", profile.farm_id)
    .in("status", ON_FARM);

  const { count: openHealthCount } = await supabase
    .from("health_events")
    .select("*", { count: "exact", head: true })
    .eq("farm_id", profile.farm_id)
    .eq("status", "open");

  // PostgREST can't compare two columns in a filter, so pull the two
  // numbers and count in JS: low stock = below the item's own threshold.
  const { data: medStock } = await supabase
    .from("medicine_inventory")
    .select("stock_qty, restock_threshold")
    .eq("farm_id", profile.farm_id);
  const lowStockCount = (medStock ?? []).filter(
    (m) => Number(m.stock_qty) < Number(m.restock_threshold)
  ).length;

  const { data: recentEvents } = await supabase
    .from("health_events")
    .select("id, notes, symptoms, created_at, animals(tag_id)")
    .eq("farm_id", profile.farm_id)
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: vaccinationsDue } = await supabase
    .from("vaccinations_due")
    .select(
      "animal_id, tag_id, species, vaccination_type_id, vaccination_type_name, reason, due_date"
    )
    .eq("farm_id", profile.farm_id)
    .order("due_date", { ascending: true, nullsFirst: true });

  const due = (vaccinationsDue ?? []) as DueRow[];
  const events = recentEvents ?? [];

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px 48px" }}>
      <header style={{ marginBottom: 20 }}>
        <h1
          style={{
            color: "var(--forest)",
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "-0.01em",
            margin: 0,
          }}
        >
          {farm?.name ?? "Your farm"}
        </h1>
        <p style={{ color: "var(--text-muted)", margin: "4px 0 0", fontSize: 14 }}>
          Owner dashboard
        </p>
      </header>

      <Nav role="owner" />

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
          marginBottom: 28,
        }}
      >
        <StatCard label="Animals on farm" value={animalCount ?? 0} />
        <StatCard label="Open health events" value={openHealthCount ?? 0} />
        <StatCard label="Low-stock medicines" value={lowStockCount} />
        <StatCard label="Vaccinations due" value={due.length} />
      </section>

      <div style={{ display: "grid", gap: 14 }}>
        {due.length === 0 ? (
          <Collapsible title="Vaccinations" count={0}>
            <p style={{ color: "var(--text-muted)", margin: 0 }}>
              Nothing due.
            </p>
          </Collapsible>
        ) : (
          <VaccinationsDue rows={due} />
        )}

        <Collapsible title="Recent activity" count={events.length}>
          {events.length === 0 ? (
            <p style={{ color: "var(--text-muted)", margin: 0 }}>
              Nothing logged yet.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {events.map((e) => (
                <li
                  key={e.id}
                  style={{
                    border: "1px solid var(--card-border)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    marginTop: 8,
                    background: "#fff",
                  }}
                >
                  <strong>
                    {(e.animals as { tag_id?: string } | null)?.tag_id ??
                      "Unknown animal"}
                  </strong>
                  <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    {(e.symptoms ?? []).join(", ") || e.notes || "—"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Collapsible>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        border: "1px solid var(--card-border)",
        borderRadius: 12,
        padding: "14px 16px",
        background: "#fff",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <div
        style={{ fontSize: 30, fontWeight: 800, color: "var(--terracotta)" }}
      >
        {value}
      </div>
      <div style={{ color: "var(--text-muted)", fontSize: 12.5, marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}
