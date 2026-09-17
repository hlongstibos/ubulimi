import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnimalForm from "./AnimalForm";

type AnimalRow = {
  id: string;
  tag_id: string;
  species: string;
  breed: string | null;
  status: string;
  camps: { name: string } | null;
};

const FILTERS = [
  { key: "on-farm", label: "On farm" },
  { key: "all", label: "All" },
  { key: "sold", label: "Sold" },
  { key: "deceased", label: "Deceased" },
  { key: "culled", label: "Culled" },
];

const th: React.CSSProperties = {
  textAlign: "left",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 0.4,
  color: "var(--text-muted)",
  padding: "8px 10px",
  borderBottom: "1px solid var(--card-border)",
};

const td: React.CSSProperties = {
  padding: "10px",
  borderBottom: "1px solid var(--card-border)",
  fontSize: 14,
};

export default async function AnimalsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: rawFilter } = await searchParams;
  const filter = FILTERS.some((f) => f.key === rawFilter) ? rawFilter! : "on-farm";

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
        <h1 style={{ color: "var(--forest)" }}>Animals</h1>
        <p style={{ color: "var(--text-muted)" }}>
          Your profile isn&rsquo;t linked to a farm yet.
        </p>
      </main>
    );
  }

  let animalsQuery = supabase
    .from("animals")
    .select("id, tag_id, species, breed, status, camps(name)")
    .eq("farm_id", profile.farm_id)
    .order("tag_id");

  if (filter === "on-farm") animalsQuery = animalsQuery.eq("status", "active");
  else if (filter !== "all") animalsQuery = animalsQuery.eq("status", filter);

  const [{ data: animals }, { data: camps }, { data: allForOptions }] =
    await Promise.all([
      animalsQuery,
      supabase
        .from("camps")
        .select("id, name")
        .eq("farm_id", profile.farm_id)
        .order("name"),
      supabase
        .from("animals")
        .select("species, breed")
        .eq("farm_id", profile.farm_id),
    ]);

  const rows = (animals ?? []) as unknown as AnimalRow[];
  const speciesOptions = Array.from(
    new Set((allForOptions ?? []).map((a) => a.species).filter(Boolean))
  );
  const breedOptions = Array.from(
    new Set(
      (allForOptions ?? [])
        .map((a) => a.breed)
        .filter((b): b is string => Boolean(b))
    )
  );

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px 48px" }}>
      <header
        style={{
          marginBottom: 20,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
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
            Animals
          </h1>
        </div>
        <Link
          href="/camps"
          style={{
            color: "var(--forest)",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Manage camps
        </Link>
      </header>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Add an animal</h2>
        <AnimalForm
          farmId={profile.farm_id}
          camps={camps ?? []}
          speciesOptions={speciesOptions}
          breedOptions={breedOptions}
        />
      </section>

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
                href={f.key === "on-farm" ? "/animals" : `/animals?filter=${f.key}`}
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
                {f.label}
              </Link>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No animals here.</p>
        ) : (
          <div
            className="card"
            style={{ overflowX: "auto", padding: "4px 4px 0" }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Tag</th>
                  <th style={th}>Species</th>
                  <th style={th}>Breed</th>
                  <th style={th}>Camp</th>
                  <th style={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td style={td}>
                      <Link
                        href={`/animals/${a.id}`}
                        style={{
                          color: "var(--forest)",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        {a.tag_id}
                      </Link>
                    </td>
                    <td style={td}>{a.species}</td>
                    <td style={td}>{a.breed ?? "—"}</td>
                    <td style={td}>{a.camps?.name ?? "—"}</td>
                    <td style={td}>{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
