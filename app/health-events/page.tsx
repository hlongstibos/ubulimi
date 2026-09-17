import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Row = {
  id: string;
  symptoms: string[];
  notes: string | null;
  status: string;
  created_at: string;
  animal_id: string;
  animals: { tag_id: string; species: string } | null;
};

const FILTERS = [
  { key: "open", label: "Open" },
  { key: "resolved", label: "Resolved" },
  { key: "all", label: "All" },
];

export default async function HealthEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: rawFilter } = await searchParams;
  const filter = FILTERS.some((f) => f.key === rawFilter) ? rawFilter! : "open";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("farm_id")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  if (!profile.farm_id) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px 48px" }}>
        <h1 style={{ color: "var(--forest)" }}>Health events</h1>
        <p style={{ color: "var(--text-muted)" }}>
          Your profile isn&rsquo;t linked to a farm yet.
        </p>
      </main>
    );
  }

  let eventsQuery = supabase
    .from("health_events")
    .select(
      "id, symptoms, notes, status, created_at, animal_id, animals(tag_id, species)"
    )
    .eq("farm_id", profile.farm_id)
    .order("created_at", { ascending: false });
  if (filter !== "all") eventsQuery = eventsQuery.eq("status", filter);

  const [
    { data: events },
    { count: openCount },
    { count: resolvedCount },
    { count: allCount },
  ] = await Promise.all([
    eventsQuery,
    supabase
      .from("health_events")
      .select("*", { count: "exact", head: true })
      .eq("farm_id", profile.farm_id)
      .eq("status", "open"),
    supabase
      .from("health_events")
      .select("*", { count: "exact", head: true })
      .eq("farm_id", profile.farm_id)
      .eq("status", "resolved"),
    supabase
      .from("health_events")
      .select("*", { count: "exact", head: true })
      .eq("farm_id", profile.farm_id),
  ]);

  const rows = (events ?? []) as unknown as Row[];

  // Refine "open" into "open · being treated" the same way the detail page
  // does, by checking which of the listed events already have a treatment.
  let treatedIds = new Set<string>();
  const eventIds = rows.map((r) => r.id);
  if (eventIds.length > 0) {
    const { data: treatedRows } = await supabase
      .from("treatments")
      .select("health_event_id")
      .eq("farm_id", profile.farm_id)
      .in("health_event_id", eventIds);
    treatedIds = new Set((treatedRows ?? []).map((t) => t.health_event_id));
  }

  const counts: Record<string, number> = {
    open: openCount ?? 0,
    resolved: resolvedCount ?? 0,
    all: allCount ?? 0,
  };

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px 48px" }}>
      <header style={{ marginBottom: 20 }}>
        <h1
          style={{
            color: "var(--forest)",
            fontSize: 24,
            fontWeight: 800,
            margin: 0,
          }}
        >
          Health events
        </h1>
        <p style={{ color: "var(--text-muted)", margin: "4px 0 0", fontSize: 14 }}>
          Every symptom logged for the farm — open and resolved.
        </p>
      </header>

      <section>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <h2 style={{ fontSize: 16, margin: 0 }}>
            {FILTERS.find((f) => f.key === filter)?.label} ({rows.length})
          </h2>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {FILTERS.map((f) => (
              <Link
                key={f.key}
                href={f.key === "open" ? "/health-events" : `/health-events?filter=${f.key}`}
                style={{
                  padding: "5px 11px",
                  borderRadius: 999,
                  fontSize: 12.5,
                  fontWeight: 600,
                  textDecoration: "none",
                  border: "1px solid var(--card-border)",
                  background: f.key === filter ? "var(--forest)" : "#fff",
                  color: f.key === filter ? "#fff" : "var(--text-muted)",
                }}
              >
                {f.label} ({counts[f.key]})
              </Link>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No health events here.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
            {rows.map((e) => {
              const resolved = e.status === "resolved";
              const statusLabel = resolved
                ? "Resolved"
                : treatedIds.has(e.id)
                  ? "Open · being treated"
                  : "Open";
              const symptoms = e.symptoms ?? [];
              return (
                <li key={e.id} className="card" style={{ padding: 0 }}>
                  <Link
                    href={`/health-events/${e.id}`}
                    style={{
                      display: "block",
                      padding: "12px 14px",
                      color: "inherit",
                      textDecoration: "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <strong style={{ color: "var(--forest)" }}>
                        {e.animals?.tag_id ?? "Unknown animal"}
                        {e.animals?.species ? (
                          <span
                            style={{
                              color: "var(--text-muted)",
                              fontWeight: 400,
                            }}
                          >
                            {" "}
                            · {e.animals.species}
                          </span>
                        ) : null}
                      </strong>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: 0.4,
                          color: resolved ? "var(--forest)" : "var(--terracotta)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    {symptoms.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 4,
                          margin: "6px 0 2px",
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

                    <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
                      {e.notes ? `${e.notes} · ` : ""}
                      {e.created_at.slice(0, 10)}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
