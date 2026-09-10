import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/app/ui/Nav";
import Collapsible from "@/app/ui/Collapsible";
import VaccinationsDue, { type DueRow } from "@/app/ui/VaccinationsDue";

export default async function TodayPage() {
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
    <main style={{ maxWidth: 620, margin: "0 auto", padding: "28px 20px 48px" }}>
      <header style={{ marginBottom: 18 }}>
        <h1
          style={{
            color: "var(--forest)",
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "-0.01em",
            margin: 0,
          }}
        >
          Hi {profile.full_name ?? "there"}
        </h1>
        <p style={{ color: "var(--text-muted)", margin: "4px 0 0", fontSize: 14 }}>
          Today&apos;s tasks
        </p>
      </header>

      <Nav role={profile.role} exclude={["/log-event"]} />

      <Link
        href="/log-event"
        style={{
          display: "block",
          textAlign: "center",
          padding: "15px 20px",
          background: "var(--terracotta)",
          color: "white",
          borderRadius: 999,
          fontWeight: 700,
          fontSize: 16,
          textDecoration: "none",
          marginBottom: 22,
          boxShadow: "0 2px 8px rgba(201,123,46,0.28)",
        }}
      >
        Log a health event
      </Link>

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
