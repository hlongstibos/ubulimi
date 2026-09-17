import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MedicineForm from "./MedicineForm";
import Collapsible from "@/app/ui/Collapsible";

type Row = {
  id: string;
  name: string;
  type: string;
  treats_conditions: string[];
  stock_qty: number;
  unit: string;
  expiry_date: string | null;
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

export default async function MedicinePage() {
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
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
        <h1 style={{ color: "var(--forest)" }}>Medicine</h1>
        <p style={{ color: "var(--text-muted)" }}>
          Your profile isn&rsquo;t linked to a farm yet.
        </p>
      </main>
    );
  }

  const { data: meds } = await supabase
    .from("medicine_inventory")
    .select("id, name, type, treats_conditions, stock_qty, unit, expiry_date")
    .eq("farm_id", profile.farm_id)
    .order("name");

  const rows = (meds ?? []) as Row[];

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
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
        <h1 style={{ color: "var(--forest)", margin: "8px 0 0" }}>Medicine</h1>
      </header>

      <section style={{ marginBottom: 24 }}>
        <Collapsible title="Add medicine" defaultOpen={rows.length === 0}>
          <MedicineForm farmId={profile.farm_id} role={profile.role} />
        </Collapsible>
      </section>

      <section>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>
          Inventory{rows.length > 0 ? ` (${rows.length})` : ""}
        </h2>
        {rows.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No medicine yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Name</th>
                  <th style={th}>Type</th>
                  <th style={th}>Treats</th>
                  <th style={th}>Stock</th>
                  <th style={th}>Expiry</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id}>
                    <td style={td}>
                      <Link
                        href={`/medicine/${m.id}`}
                        style={{
                          color: "var(--forest)",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        {m.name}
                      </Link>
                    </td>
                    <td style={td}>{m.type}</td>
                    <td style={td}>
                      {m.treats_conditions.length === 0 ? (
                        "—"
                      ) : (
                        <span style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {m.treats_conditions.map((c) => (
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
                        </span>
                      )}
                    </td>
                    <td style={td}>
                      {m.stock_qty} {m.unit}
                    </td>
                    <td style={td}>{m.expiry_date ?? "—"}</td>
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
