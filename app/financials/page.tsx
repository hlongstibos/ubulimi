import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/app/ui/Nav";
import Collapsible from "@/app/ui/Collapsible";
import DownloadFinancials from "./DownloadFinancials";
import type { FinancialsData } from "./financialsReport";

const PERIODS = [
  { key: "30", label: "Last 30 days", days: 30 },
  { key: "90", label: "Last 90 days", days: 90 },
  { key: "365", label: "Last 12 months", days: 365 },
  { key: "all", label: "All time", days: null as number | null },
];

function money(n: number, dp = 0) {
  return (
    "R " +
    n.toLocaleString("en-ZA", {
      minimumFractionDigits: dp,
      maximumFractionDigits: dp,
    })
  );
}

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
  padding: "9px 10px",
  borderBottom: "1px solid var(--card-border)",
  fontSize: 14,
};
const tdNum: React.CSSProperties = { ...td, textAlign: "right" };

export default async function FinancialsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: rawPeriod } = await searchParams;
  const period = PERIODS.find((p) => p.key === rawPeriod) ?? PERIODS[2];

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
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px 48px" }}>
        <h1 style={{ color: "var(--forest)" }}>Financials</h1>
        <p style={{ color: "var(--text-muted)" }}>
          Your profile isn&rsquo;t linked to a farm yet.
        </p>
      </main>
    );
  }

  const sinceMs =
    period.days == null ? 0 : Date.now() - period.days * 86_400_000;
  const sinceDate = new Date(sinceMs).toISOString().slice(0, 10);
  const sinceTs = new Date(sinceMs).toISOString();

  const [
    { data: farm },
    { data: salesRows },
    { data: feedingRows },
    { data: treatmentRows },
    { data: vaxRows },
    { data: vaxTypes },
    { data: medInv },
    { data: medCosts },
    { data: feedInv },
  ] = await Promise.all([
    supabase.from("farms").select("name").eq("id", profile.farm_id).single(),
    supabase
      .from("sales")
      .select("id, price, sale_date, buyer, animals(species)")
      .eq("farm_id", profile.farm_id)
      .gte("sale_date", sinceDate)
      .order("sale_date", { ascending: false }),
    supabase
      .from("feeding_events")
      .select("quantity, feed_inventory(name, unit, cost)")
      .eq("farm_id", profile.farm_id)
      .gte("logged_at", sinceTs),
    supabase
      .from("treatments")
      .select("medicine_id")
      .eq("farm_id", profile.farm_id)
      .gte("administered_at", sinceTs),
    supabase
      .from("vaccination_records")
      .select("vaccination_type_id")
      .eq("farm_id", profile.farm_id)
      .gte("administered_at", sinceTs),
    supabase
      .from("vaccination_types")
      .select("id, name, linked_medicine_id")
      .eq("farm_id", profile.farm_id),
    supabase
      .from("medicine_inventory")
      .select("id, name, stock_qty, unit")
      .eq("farm_id", profile.farm_id),
    supabase.from("medicine_costs").select("medicine_id, cost"),
    supabase
      .from("feed_inventory")
      .select("name, stock_qty, unit, cost")
      .eq("farm_id", profile.farm_id),
  ]);

  // ---- medicine id -> { name, cost } ----
  const costByMedId = new Map<string, number>();
  for (const c of medCosts ?? [])
    costByMedId.set(c.medicine_id as string, Number(c.cost ?? 0));
  const medById = new Map<string, { name: string; cost: number }>();
  for (const m of medInv ?? [])
    medById.set(m.id as string, {
      name: m.name as string,
      cost: costByMedId.get(m.id as string) ?? 0,
    });
  const vtById = new Map<
    string,
    { name: string; linked_medicine_id: string | null }
  >();
  for (const v of vaxTypes ?? [])
    vtById.set(v.id as string, {
      name: v.name as string,
      linked_medicine_id: v.linked_medicine_id as string | null,
    });

  // ---- sales ----
  const sales = salesRows ?? [];
  const salesRevenue = sales.reduce((s, r) => s + Number(r.price ?? 0), 0);
  const salesBySpecies = new Map<string, { count: number; total: number }>();
  for (const r of sales) {
    const sp =
      (r.animals as { species?: string } | null)?.species ?? "Unknown";
    const e = salesBySpecies.get(sp) ?? { count: 0, total: 0 };
    e.count += 1;
    e.total += Number(r.price ?? 0);
    salesBySpecies.set(sp, e);
  }

  // ---- feed used ----
  const feedByName = new Map<
    string,
    { qty: number; unit: string; total: number }
  >();
  let feedCost = 0;
  for (const f of feedingRows ?? []) {
    const fi = f.feed_inventory as
      | { name?: string; unit?: string; cost?: number }
      | null;
    const name = fi?.name ?? "Unknown feed";
    const line = Number(f.quantity ?? 0) * Number(fi?.cost ?? 0);
    feedCost += line;
    const e = feedByName.get(name) ?? { qty: 0, unit: fi?.unit ?? "", total: 0 };
    e.qty += Number(f.quantity ?? 0);
    e.total += line;
    feedByName.set(name, e);
  }

  // ---- medicine + vaccination used (estimated: 1 unit / dose each) ----
  const medUse = new Map<
    string,
    { count: number; unitCost: number; total: number }
  >();
  let medCost = 0;
  for (const t of treatmentRows ?? []) {
    const m = medById.get(t.medicine_id as string);
    const name = m?.name ?? "Unknown medicine";
    const uc = m?.cost ?? 0;
    const e = medUse.get(name) ?? { count: 0, unitCost: uc, total: 0 };
    e.count += 1;
    e.total += uc;
    medCost += uc;
    medUse.set(name, e);
  }
  for (const v of vaxRows ?? []) {
    const vt = vtById.get(v.vaccination_type_id as string);
    const m = vt?.linked_medicine_id
      ? medById.get(vt.linked_medicine_id)
      : null;
    const label = `${vt?.name ?? "Vaccination"} (vaccine)`;
    const uc = m?.cost ?? 0;
    const e = medUse.get(label) ?? { count: 0, unitCost: uc, total: 0 };
    e.count += 1;
    e.total += uc;
    medCost += uc;
    medUse.set(label, e);
  }

  // ---- inventory value on hand (now) ----
  const medOnHand = (medInv ?? []).reduce(
    (s, m) =>
      s + Number(m.stock_qty ?? 0) * (costByMedId.get(m.id as string) ?? 0),
    0
  );
  const feedOnHand = (feedInv ?? []).reduce(
    (s, f) => s + Number(f.stock_qty ?? 0) * Number(f.cost ?? 0),
    0
  );

  const trackedCosts = feedCost + medCost;
  const net = salesRevenue - trackedCosts;

  const sortedSpecies = [...salesBySpecies.entries()].sort(
    (a, b) => b[1].total - a[1].total
  );
  const sortedFeed = [...feedByName.entries()].sort(
    (a, b) => b[1].total - a[1].total
  );
  const sortedMed = [...medUse.entries()].sort(
    (a, b) => b[1].total - a[1].total
  );

  const reportData: FinancialsData = {
    farmName: (farm as { name?: string } | null)?.name ?? null,
    periodLabel: period.label,
    generatedAt: new Date().toISOString(),
    salesRevenue,
    salesCount: sales.length,
    feedCost,
    medCost,
    net,
    medOnHand,
    feedOnHand,
    salesBySpecies: sortedSpecies.map(([species, v]) => ({
      species,
      count: v.count,
      total: v.total,
    })),
    feedUsed: sortedFeed.map(([name, v]) => ({
      name,
      qty: v.qty,
      unit: v.unit,
      total: v.total,
    })),
    medUsed: sortedMed.map(([name, v]) => ({
      name,
      count: v.count,
      unitCost: v.unitCost,
      total: v.total,
    })),
  };

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px 48px" }}>
      <header style={{ marginBottom: 16 }}>
        <h1
          style={{
            color: "var(--forest)",
            fontSize: 24,
            fontWeight: 800,
            margin: 0,
          }}
        >
          Financials
        </h1>
        <p style={{ color: "var(--text-muted)", margin: "4px 0 0", fontSize: 14 }}>
          {(farm as { name?: string } | null)?.name ?? "Your farm"} ·{" "}
          {period.label}
        </p>
      </header>

      <Nav role="owner" />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 18,
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {PERIODS.map((p) => (
            <Link
              key={p.key}
              href={p.key === "365" ? "/financials" : `/financials?period=${p.key}`}
              style={{
                padding: "5px 11px",
                borderRadius: 999,
                fontSize: 12.5,
                fontWeight: 600,
                textDecoration: "none",
                border: "1px solid var(--card-border)",
                background: p.key === period.key ? "var(--forest)" : "#fff",
                color: p.key === period.key ? "#fff" : "var(--text-muted)",
              }}
            >
              {p.label}
            </Link>
          ))}
        </div>
        <DownloadFinancials data={reportData} />
      </div>

      {/* Headline */}
      <div
        className="card"
        style={{ padding: 18, marginBottom: 18 }}
      >
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Net position · {period.label}
        </div>
        <div
          style={{
            fontSize: 34,
            fontWeight: 800,
            color: net >= 0 ? "var(--forest)" : "#b3413e",
            margin: "2px 0 6px",
          }}
        >
          {money(net)}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {money(salesRevenue)} sales &minus; {money(trackedCosts)} tracked feed
          &amp; medicine cost
        </div>
      </div>

      {/* Tiles */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 22,
        }}
      >
        <Tile label={`Sales revenue`} value={money(salesRevenue)} sub={`${sales.length} sold`} />
        <Tile label="Feed cost" value={money(feedCost)} sub="from feeding logs" />
        <Tile
          label="Medicine & vaccination"
          value={money(medCost)}
          sub="estimated"
        />
        <Tile
          label="Stock value on hand"
          value={money(medOnHand + feedOnHand)}
          sub="medicine + feed, now"
        />
      </section>

      <div style={{ display: "grid", gap: 14 }}>
        <Collapsible
          title="Sales by species"
          count={sortedSpecies.length}
          defaultOpen
        >
          {sortedSpecies.length === 0 ? (
            <p style={{ color: "var(--text-muted)", margin: 0 }}>
              No sales in this period.
            </p>
          ) : (
            <Table
              head={["Species", "Sold", "Revenue", "Avg price"]}
              rows={sortedSpecies.map(([sp, v]) => [
                sp,
                String(v.count),
                money(v.total),
                money(v.count ? v.total / v.count : 0),
              ])}
              foot={[
                "Total",
                String(sales.length),
                money(salesRevenue),
                money(sales.length ? salesRevenue / sales.length : 0),
              ]}
            />
          )}
        </Collapsible>

        <Collapsible title="Feed used" count={sortedFeed.length}>
          {sortedFeed.length === 0 ? (
            <p style={{ color: "var(--text-muted)", margin: 0 }}>
              No feeding logged in this period.
            </p>
          ) : (
            <Table
              head={["Feed", "Quantity", "Cost"]}
              rows={sortedFeed.map(([name, v]) => [
                name,
                `${v.qty.toLocaleString("en-ZA")} ${v.unit}`,
                money(v.total),
              ])}
              foot={["Total", "", money(feedCost)]}
            />
          )}
        </Collapsible>

        <Collapsible title="Medicine & vaccination used" count={sortedMed.length}>
          {sortedMed.length === 0 ? (
            <p style={{ color: "var(--text-muted)", margin: 0 }}>
              No treatments or vaccinations in this period.
            </p>
          ) : (
            <>
              <Table
                head={["Item", "Count", "Unit cost", "Cost (est.)"]}
                rows={sortedMed.map(([name, v]) => [
                  name,
                  String(v.count),
                  money(v.unitCost, 2),
                  money(v.total),
                ])}
                foot={["Total", "", "", money(medCost)]}
              />
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  margin: "8px 0 0",
                }}
              >
                Estimated at one unit / dose per record (per-dose quantities
                aren&rsquo;t stored). Items with no cost captured count as R&nbsp;0.
              </p>
            </>
          )}
        </Collapsible>

        <Collapsible title="Stock value on hand" count={2}>
          <Table
            head={["Category", "Value"]}
            rows={[
              ["Medicine inventory", money(medOnHand)],
              ["Feed inventory", money(feedOnHand)],
            ]}
            foot={["Total", money(medOnHand + feedOnHand)]}
          />
        </Collapsible>
      </div>

      <p
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          marginTop: 20,
          lineHeight: 1.5,
        }}
      >
        The value the app adds: sales, feed use and medicine use are captured as
        you log day-to-day work, so this page turns them into a running money
        picture without any separate bookkeeping. Sales revenue and feed cost are
        exact; medicine cost is an estimate; labour, transport and other overheads
        are not tracked.
      </p>
    </main>
  );
}

function Tile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="card" style={{ padding: "13px 15px" }}>
      <div style={{ fontSize: 19, fontWeight: 800, color: "var(--text-dark)" }}>
        {value}
      </div>
      <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 3 }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function Table({
  head,
  rows,
  foot,
}: {
  head: string[];
  rows: string[][];
  foot?: string[];
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={h} style={i === 0 ? th : { ...th, textAlign: "right" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td key={ci} style={ci === 0 ? td : tdNum}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {foot && (
          <tfoot>
            <tr>
              {foot.map((c, ci) => (
                <td
                  key={ci}
                  style={{
                    ...(ci === 0 ? td : tdNum),
                    fontWeight: 700,
                    borderTop: "2px solid var(--card-border)",
                    borderBottom: "none",
                  }}
                >
                  {c}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
