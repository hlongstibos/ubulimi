import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VaccinationsDue, { type DueRow } from "@/app/ui/VaccinationsDue";

const navLink: React.CSSProperties = {
  color: "var(--forest)",
  fontSize: 14,
  fontWeight: 600,
  textDecoration: "none",
};

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
    .limit(5);

  const { data: vaccinationsDue } = await supabase
    .from("vaccinations_due")
    .select(
      "animal_id, tag_id, species, vaccination_type_name, reason, due_date"
    )
    .eq("farm_id", profile.farm_id)
    .order("due_date", { ascending: true, nullsFirst: true });

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: "32px 20px" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ color: "var(--forest)", marginBottom: 0 }}>
          Hi {profile.full_name ?? "there"}
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: 4 }}>Today&apos;s activity</p>
      </header>

      <nav style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <Link href="/log-event" style={navLink}>
          Log event
        </Link>
        <Link href="/log-vaccination" style={navLink}>
          Log vaccination
        </Link>
        <Link href="/animals" style={navLink}>
          Animals
        </Link>
        <Link href="/camps" style={navLink}>
          Camps
        </Link>
        <Link href="/medicine" style={navLink}>
          Medicine
        </Link>
      </nav>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Vaccinations due</h2>
        <VaccinationsDue rows={(vaccinationsDue ?? []) as DueRow[]} />
      </section>

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
    </main>
  );
}
