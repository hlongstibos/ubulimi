"use client";

// Loaded only via dynamic import() from DownloadReport, so
// @react-pdf/renderer never enters the SSR or initial client bundle.

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";

const C = {
  forest: "#2c5f2d",
  terracotta: "#c97b2e",
  border: "#dce5d6",
  headFill: "#f4f7f1",
  saleFill: "#faf3ec",
  muted: "#6b7566",
  dark: "#26301f",
};

export type ReportData = {
  farmName: string | null;
  generatedAt: string;
  animal: {
    tag_id: string;
    species: string;
    breed: string | null;
    sex: string | null;
    dob: string | null;
    status: string;
  };
  vaccinations: {
    administered_at: string;
    vaccinationType: string | null;
    next_due_date: string | null;
  }[];
  treatments: {
    administered_at: string;
    medicine: string | null;
    dosage: string | null;
  }[];
  sale: { buyer: string | null; price: number | null; sale_date: string } | null;
};

const s = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 56,
    paddingHorizontal: 44,
    fontSize: 10,
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
    marginBottom: 4,
  },
  tag: { fontSize: 17, fontFamily: "Helvetica-Bold", marginTop: 14 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.forest,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 18,
    marginBottom: 6,
  },
  kv: { flexDirection: "row", marginBottom: 3 },
  kvKey: { width: 120, color: C.muted },
  kvVal: { flex: 1 },
  saleBox: {
    marginTop: 8,
    padding: 10,
    backgroundColor: C.saleFill,
    borderWidth: 1,
    borderColor: C.terracotta,
    borderRadius: 4,
  },
  tHead: {
    flexDirection: "row",
    backgroundColor: C.headFill,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  tRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  th: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  td: { fontSize: 9.5 },
  empty: { fontSize: 9, color: C.muted, fontStyle: "italic", marginTop: 2 },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 44,
    right: 44,
    fontSize: 8,
    color: C.muted,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 6,
  },
});

const day = (iso: string | null) => (iso ? iso.slice(0, 10) : "—");
const money = (n: number | null) =>
  n == null ? "—" : `R ${Number(n).toLocaleString("en-ZA")}`;

function KV({ k, v }: { k: string; v: string }) {
  return (
    <View style={s.kv}>
      <Text style={s.kvKey}>{k}</Text>
      <Text style={s.kvVal}>{v}</Text>
    </View>
  );
}

export function buildAnimalReport(d: ReportData) {
  const a = d.animal;
  const vax = [...d.vaccinations].sort((x, y) =>
    x.administered_at < y.administered_at ? 1 : -1
  );
  const tx = [...d.treatments].sort((x, y) =>
    x.administered_at < y.administered_at ? 1 : -1
  );

  return (
    <Document
      title={`${a.tag_id} — animal history`}
      author={d.farmName ?? "Ubulimi"}
    >
      <Page size="A4" style={s.page}>
        <Text style={s.title}>Animal History Report</Text>
        <Text style={s.meta}>
          {d.farmName ? `${d.farmName}  ·  ` : ""}Generated {day(d.generatedAt)}
        </Text>
        <View style={s.rule} />

        <Text style={s.tag}>{a.tag_id}</Text>

        <Text style={s.sectionTitle}>Animal</Text>
        <KV k="Tag ID" v={a.tag_id} />
        <KV k="Species" v={a.species} />
        <KV k="Breed" v={a.breed ?? "—"} />
        <KV k="Sex" v={a.sex ?? "—"} />
        <KV k="Date of birth" v={day(a.dob)} />
        <KV k="Status" v={a.status} />

        {d.sale && (
          <>
            <Text style={s.sectionTitle}>Sale</Text>
            <View style={s.saleBox}>
              <KV k="Buyer" v={d.sale.buyer ?? "—"} />
              <KV k="Price" v={money(d.sale.price)} />
              <KV k="Sale date" v={day(d.sale.sale_date)} />
            </View>
          </>
        )}

        <Text style={s.sectionTitle}>Vaccinations</Text>
        {vax.length === 0 ? (
          <Text style={s.empty}>No vaccinations recorded.</Text>
        ) : (
          <View>
            <View style={s.tHead}>
              <Text style={[s.th, { width: 80 }]}>Date</Text>
              <Text style={[s.th, { flex: 1 }]}>Vaccination</Text>
              <Text style={[s.th, { width: 90 }]}>Next due</Text>
            </View>
            {vax.map((v, i) => (
              <View style={s.tRow} key={i}>
                <Text style={[s.td, { width: 80 }]}>
                  {day(v.administered_at)}
                </Text>
                <Text style={[s.td, { flex: 1 }]}>
                  {v.vaccinationType ?? "—"}
                </Text>
                <Text style={[s.td, { width: 90 }]}>
                  {day(v.next_due_date)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text style={s.sectionTitle}>Treatments</Text>
        {tx.length === 0 ? (
          <Text style={s.empty}>No treatments recorded.</Text>
        ) : (
          <View>
            <View style={s.tHead}>
              <Text style={[s.th, { width: 80 }]}>Date</Text>
              <Text style={[s.th, { flex: 1 }]}>Medicine</Text>
              <Text style={[s.th, { width: 120 }]}>Dosage</Text>
            </View>
            {tx.map((t, i) => (
              <View style={s.tRow} key={i}>
                <Text style={[s.td, { width: 80 }]}>
                  {day(t.administered_at)}
                </Text>
                <Text style={[s.td, { flex: 1 }]}>{t.medicine ?? "—"}</Text>
                <Text style={[s.td, { width: 120 }]}>{t.dosage ?? "—"}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={s.footer} fixed>
          Record produced from {d.farmName ?? "the farm"}&rsquo;s own logs in
          Ubulimi. Vaccination and treatment dates are as entered by farm staff.
        </Text>
      </Page>
    </Document>
  );
}
