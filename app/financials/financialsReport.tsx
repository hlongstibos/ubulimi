"use client";

// Loaded only via dynamic import() from DownloadFinancials.

import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

const C = {
  forest: "#2c5f2d",
  terracotta: "#c97b2e",
  border: "#e3e1db",
  headFill: "#f7f6f3",
  muted: "#78766f",
  dark: "#2a2a27",
  red: "#b3413e",
};

export type FinancialsData = {
  farmName: string | null;
  periodLabel: string;
  generatedAt: string;
  salesRevenue: number;
  salesCount: number;
  feedCost: number;
  medCost: number;
  net: number;
  medOnHand: number;
  feedOnHand: number;
  salesBySpecies: { species: string; count: number; total: number }[];
  feedUsed: { name: string; qty: number; unit: string; total: number }[];
  medUsed: { name: string; count: number; unitCost: number; total: number }[];
};

function money(n: number, dp = 0) {
  return (
    "R " +
    n.toLocaleString("en-ZA", {
      minimumFractionDigits: dp,
      maximumFractionDigits: dp,
    })
  );
}

const s = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 50,
    paddingHorizontal: 44,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: C.dark,
    lineHeight: 1.4,
  },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", color: C.forest },
  meta: { fontSize: 9, color: C.muted, marginTop: 3 },
  rule: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginTop: 12,
    marginBottom: 6,
  },
  netLabel: { fontSize: 9, color: C.muted, marginTop: 14 },
  net: { fontSize: 22, fontFamily: "Helvetica-Bold" },
  netSub: { fontSize: 9, color: C.muted },
  tilesRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  tile: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    padding: 8,
  },
  tileVal: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  tileLabel: { fontSize: 7.5, color: C.muted, marginTop: 2 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.forest,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 18,
    marginBottom: 5,
  },
  tHead: {
    flexDirection: "row",
    backgroundColor: C.headFill,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 4,
    paddingHorizontal: 5,
  },
  tRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    paddingVertical: 4,
    paddingHorizontal: 5,
  },
  tFoot: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: C.muted,
    paddingVertical: 4,
    paddingHorizontal: 5,
  },
  th: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: C.muted,
    textTransform: "uppercase",
  },
  td: { fontSize: 9 },
  tdBold: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  empty: { fontSize: 9, color: C.muted, fontStyle: "italic" },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 44,
    right: 44,
    fontSize: 7.5,
    color: C.muted,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 5,
  },
});

function Row({
  cells,
  widths,
  variant = "row",
}: {
  cells: string[];
  widths: number[];
  variant?: "head" | "row" | "foot";
}) {
  const base =
    variant === "head" ? s.tHead : variant === "foot" ? s.tFoot : s.tRow;
  const cell =
    variant === "head" ? s.th : variant === "foot" ? s.tdBold : s.td;
  return (
    <View style={base}>
      {cells.map((c, i) => (
        <Text
          key={i}
          style={[
            cell,
            { flex: widths[i], textAlign: i === 0 ? "left" : "right" },
          ]}
        >
          {c}
        </Text>
      ))}
    </View>
  );
}

export function buildFinancialsReport(d: FinancialsData) {
  const trackedCosts = d.feedCost + d.medCost;
  return (
    <Document
      title={`Financials — ${d.periodLabel}`}
      author={d.farmName ?? "Ubulimi"}
    >
      <Page size="A4" style={s.page}>
        <Text style={s.title}>Financials Report</Text>
        <Text style={s.meta}>
          {d.farmName ? `${d.farmName}  ·  ` : ""}
          {d.periodLabel}  ·  generated {d.generatedAt.slice(0, 10)}
        </Text>
        <View style={s.rule} />

        <Text style={s.netLabel}>Net position · {d.periodLabel}</Text>
        <Text style={[s.net, { color: d.net >= 0 ? C.forest : C.red }]}>
          {money(d.net)}
        </Text>
        <Text style={s.netSub}>
          {money(d.salesRevenue)} sales &minus; {money(trackedCosts)} tracked
          feed &amp; medicine cost
        </Text>

        <View style={s.tilesRow}>
          <View style={s.tile}>
            <Text style={s.tileVal}>{money(d.salesRevenue)}</Text>
            <Text style={s.tileLabel}>Sales revenue ({d.salesCount} sold)</Text>
          </View>
          <View style={s.tile}>
            <Text style={s.tileVal}>{money(d.feedCost)}</Text>
            <Text style={s.tileLabel}>Feed cost</Text>
          </View>
          <View style={s.tile}>
            <Text style={s.tileVal}>{money(d.medCost)}</Text>
            <Text style={s.tileLabel}>Medicine &amp; vaccination (est.)</Text>
          </View>
          <View style={s.tile}>
            <Text style={s.tileVal}>{money(d.medOnHand + d.feedOnHand)}</Text>
            <Text style={s.tileLabel}>Stock value on hand</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Sales by species</Text>
        {d.salesBySpecies.length === 0 ? (
          <Text style={s.empty}>No sales in this period.</Text>
        ) : (
          <View>
            <Row
              variant="head"
              widths={[3, 1, 2, 2]}
              cells={["Species", "Sold", "Revenue", "Avg price"]}
            />
            {d.salesBySpecies.map((r, i) => (
              <Row
                key={i}
                widths={[3, 1, 2, 2]}
                cells={[
                  r.species,
                  String(r.count),
                  money(r.total),
                  money(r.count ? r.total / r.count : 0),
                ]}
              />
            ))}
            <Row
              variant="foot"
              widths={[3, 1, 2, 2]}
              cells={[
                "Total",
                String(d.salesCount),
                money(d.salesRevenue),
                money(d.salesCount ? d.salesRevenue / d.salesCount : 0),
              ]}
            />
          </View>
        )}

        <Text style={s.sectionTitle}>Feed used</Text>
        {d.feedUsed.length === 0 ? (
          <Text style={s.empty}>No feeding logged in this period.</Text>
        ) : (
          <View>
            <Row
              variant="head"
              widths={[4, 3, 2]}
              cells={["Feed", "Quantity", "Cost"]}
            />
            {d.feedUsed.map((r, i) => (
              <Row
                key={i}
                widths={[4, 3, 2]}
                cells={[
                  r.name,
                  `${r.qty.toLocaleString("en-ZA")} ${r.unit}`,
                  money(r.total),
                ]}
              />
            ))}
            <Row
              variant="foot"
              widths={[4, 3, 2]}
              cells={["Total", "", money(d.feedCost)]}
            />
          </View>
        )}

        <Text style={s.sectionTitle}>Medicine &amp; vaccination used</Text>
        {d.medUsed.length === 0 ? (
          <Text style={s.empty}>
            No treatments or vaccinations in this period.
          </Text>
        ) : (
          <View>
            <Row
              variant="head"
              widths={[4, 1, 2, 2]}
              cells={["Item", "Count", "Unit cost", "Cost (est.)"]}
            />
            {d.medUsed.map((r, i) => (
              <Row
                key={i}
                widths={[4, 1, 2, 2]}
                cells={[
                  r.name,
                  String(r.count),
                  money(r.unitCost, 2),
                  money(r.total),
                ]}
              />
            ))}
            <Row
              variant="foot"
              widths={[4, 1, 2, 2]}
              cells={["Total", "", "", money(d.medCost)]}
            />
          </View>
        )}

        <Text style={s.footer} fixed>
          Sales revenue and feed cost are exact; medicine cost is estimated at one
          unit / dose per record. Labour, transport and other overheads are not
          tracked. Produced from {d.farmName ?? "the farm"}&rsquo;s own logs in
          Ubulimi.
        </Text>
      </Page>
    </Document>
  );
}
