import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FeedForm from "./FeedForm";
import Collapsible from "@/app/ui/Collapsible";

type Row = {
  id: string;
  name: string;
  type: string;
  stock_qty: number;
  unit: string;
  cost: number | null;
  restock_threshold: number;
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

export default async function FeedPage() {
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
        <h1 style={{ color: "var(--forest)" }}>Feed</h1>
        <p style={{ color: "var(--text-muted)" }}>
          Your profile isn&rsquo;t linked to a farm yet.
        </p>
      </main>
    );
  }

  const { data: feeds } = await supabase
    .from("feed_inventory")
    .select("id, name, type, stock_qty, unit, cost, restock_threshold")
    .eq("farm_id", profile.farm_id)
    .order("name");

  const rows = (feeds ?? []) as Row[];

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ color: "var(--forest)", margin: 0 }}>Feed</h1>
      </header>

      <section style={{ marginBottom: 24 }}>
        <Collapsible title="Add feed" defaultOpen={rows.length === 0}>
          <FeedForm farmId={profile.farm_id} />
        </Collapsible>
      </section>

      <section>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>
          Inventory{rows.length > 0 ? ` (${rows.length})` : ""}
        </h2>
        {rows.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No feed yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Name</th>
                  <th style={th}>Type</th>
                  <th style={th}>Stock</th>
                  <th style={th}>Cost</th>
                  <th style={th}>Restock at</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => (
                  <tr key={f.id}>
                    <td style={td}>
                      <Link
                        href={`/feed/${f.id}`}
                        style={{
                          color: "var(--forest)",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        {f.name}
                      </Link>
                    </td>
                    <td style={td}>{f.type}</td>
                    <td style={td}>
                      {f.stock_qty} {f.unit}
                    </td>
                    <td style={td}>{f.cost == null ? "—" : f.cost}</td>
                    <td style={td}>
                      {f.restock_threshold} {f.unit}
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
