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

export default async function AnimalsPage() {
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
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
        <h1 style={{ color: "var(--forest)" }}>Animals</h1>
        <p style={{ color: "var(--text-muted)" }}>
          Your profile isn&rsquo;t linked to a farm yet.
        </p>
      </main>
    );
  }

  const [{ data: animals }, { data: camps }] = await Promise.all([
    supabase
      .from("animals")
      .select("id, tag_id, species, breed, status, camps(name)")
      .eq("farm_id", profile.farm_id)
      .order("tag_id"),
    supabase
      .from("camps")
      .select("id, name")
      .eq("farm_id", profile.farm_id)
      .order("name"),
  ]);

  const rows = (animals ?? []) as unknown as AnimalRow[];

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
      <header
        style={{
          marginBottom: 24,
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <h1 style={{ color: "var(--forest)", margin: 0 }}>Animals</h1>
        <Link
          href="/camps"
          style={{ color: "var(--forest)", fontSize: 14, fontWeight: 600, textDecoration: "none" }}
        >
          Manage camps
        </Link>
      </header>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Add an animal</h2>
        <AnimalForm farmId={profile.farm_id} camps={camps ?? []} />
      </section>

      <section>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>
          All animals{rows.length > 0 ? ` (${rows.length})` : ""}
        </h2>
        {rows.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No animals yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
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
                        style={{ color: "var(--forest)", fontWeight: 600, textDecoration: "none" }}
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
