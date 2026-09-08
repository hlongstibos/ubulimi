import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  const { count: animalCount } = await supabase
    .from("animals")
    .select("*", { count: "exact", head: true })
    .eq("farm_id", profile.farm_id);

  const { count: openHealthCount } = await supabase
    .from("health_events")
    .select("*", { count: "exact", head: true })
    .eq("farm_id", profile.farm_id)
    .eq("status", "open");

  // Placeholder threshold comparison for V1 — swap for a proper
  // "stock_qty < restock_threshold" filter once that logic is wired up.
  const { count: lowStockCount } = await supabase
    .from("medicine_inventory")
    .select("*", { count: "exact", head: true })
    .eq("farm_id", profile.farm_id)
    .lt("stock_qty", 5);

  const { data: recentEvents } = await supabase
    .from("health_events")
    .select("id, notes, symptoms, created_at, animals(tag_id)")
    .eq("farm_id", profile.farm_id)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ color: "var(--forest)", marginBottom: 0 }}>Ubulimi</h1>
        <p style={{ color: "var(--text-muted)", marginTop: 4 }}>
          {farm?.name ?? "Your Farm"} &middot; Owner
        </p>
      </header>

      <nav style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <Link href="/animals" style={{ color: "var(--forest)", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
          Animals
        </Link>
        <Link href="/camps" style={{ color: "var(--forest)", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
          Camps
        </Link>
      </nav>

      <section style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
        <StatCard label="Animals on farm" value={animalCount ?? 0} />
        <StatCard label="Open health events" value={openHealthCount ?? 0} />
        <StatCard label="Low stock medicines" value={lowStockCount ?? 0} />
      </section>

      <section>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Recent activity</h2>
        {!recentEvents || recentEvents.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>Nothing logged yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {recentEvents.map((e) => (
              <li
                key={e.id}
                style={{
                  border: "1px solid var(--card-border)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginBottom: 8,
                }}
              >
                <strong>{(e.animals as { tag_id?: string } | null)?.tag_id ?? "Unknown animal"}</strong>
                <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                  {(e.symptoms ?? []).join(", ") || e.notes}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        border: "1px solid var(--card-border)",
        borderRadius: 8,
        padding: 16,
        flex: "1 1 160px",
        background: "var(--light-bg)",
      }}
    >
      <div style={{ fontSize: 32, fontWeight: 700, color: "var(--terracotta)" }}>{value}</div>
      <div style={{ color: "var(--text-dark)", fontSize: 13 }}>{label}</div>
    </div>
  );
}
