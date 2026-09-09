import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VaccinationTypeForm from "./VaccinationTypeForm";

type Row = {
  id: string;
  name: string;
  target_species: string[];
  initial_dose_age_days: number | null;
  booster_interval_days: number | null;
  medicine_inventory: { name: string } | null;
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
  verticalAlign: "top",
};

export default async function VaccinationTypesPage() {
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

  if (!profile.farm_id) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
        <h1 style={{ color: "var(--forest)" }}>Vaccination types</h1>
        <p style={{ color: "var(--text-muted)" }}>
          Your profile isn&rsquo;t linked to a farm yet.
        </p>
      </main>
    );
  }

  const [{ data: types }, { data: medicines }] = await Promise.all([
    supabase
      .from("vaccination_types")
      .select(
        "id, name, target_species, initial_dose_age_days, booster_interval_days, medicine_inventory(name)"
      )
      .eq("farm_id", profile.farm_id)
      .order("name"),
    supabase
      .from("medicine_inventory")
      .select("id, name")
      .eq("farm_id", profile.farm_id)
      .order("name"),
  ]);

  const rows = (types ?? []) as unknown as Row[];

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
        <h1 style={{ color: "var(--forest)", margin: 0 }}>Vaccination types</h1>
        <Link
          href="/dashboard"
          style={{
            color: "var(--forest)",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Dashboard
        </Link>
      </header>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Add a type</h2>
        <VaccinationTypeForm
          farmId={profile.farm_id}
          medicines={medicines ?? []}
        />
      </section>

      <section>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>
          Types{rows.length > 0 ? ` (${rows.length})` : ""}
        </h2>
        {rows.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No vaccination types yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Name</th>
                  <th style={th}>Target species</th>
                  <th style={th}>Linked medicine</th>
                  <th style={th}>Initial dose age</th>
                  <th style={th}>Booster interval</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id}>
                    <td style={td}>
                      <Link
                        href={`/vaccination-types/${t.id}`}
                        style={{
                          color: "var(--forest)",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        {t.name}
                      </Link>
                    </td>
                    <td style={td}>
                      {t.target_species.length === 0 ? (
                        "—"
                      ) : (
                        <span
                          style={{ display: "flex", flexWrap: "wrap", gap: 4 }}
                        >
                          {t.target_species.map((s) => (
                            <span
                              key={s}
                              style={{
                                background: "var(--moss)",
                                color: "white",
                                borderRadius: 12,
                                padding: "2px 8px",
                                fontSize: 12,
                              }}
                            >
                              {s}
                            </span>
                          ))}
                        </span>
                      )}
                    </td>
                    <td style={td}>{t.medicine_inventory?.name ?? "—"}</td>
                    <td style={td}>
                      {t.initial_dose_age_days == null
                        ? "—"
                        : `${t.initial_dose_age_days} days`}
                    </td>
                    <td style={td}>
                      {t.booster_interval_days == null
                        ? "—"
                        : `${t.booster_interval_days} days`}
                    </td>
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
