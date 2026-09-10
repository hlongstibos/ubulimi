import Link from "next/link";

type Health = {
  id: string;
  symptoms: string[];
  notes: string | null;
  status: string;
  created_at: string;
};

type Treatment = {
  id: string;
  dosage: string | null;
  administered_at: string;
  medicine: string | null;
};

type Vaccination = {
  id: string;
  administered_at: string;
  next_due_date: string | null;
  vaccinationType: string | null;
};

type Item =
  | ({ kind: "health"; date: string } & Health)
  | ({ kind: "treatment"; date: string } & Treatment)
  | ({ kind: "vaccination"; date: string } & Vaccination);

const COLORS = {
  health: "var(--terracotta)",
  treatment: "var(--moss)",
  vaccination: "var(--forest)",
} as const;

const LABELS = {
  health: "Health event",
  treatment: "Treatment",
  vaccination: "Vaccination",
} as const;

export default function AnimalTimeline({
  health,
  treatments,
  vaccinations,
}: {
  health: Health[];
  treatments: Treatment[];
  vaccinations: Vaccination[];
}) {
  const items: Item[] = [
    ...health.map((h) => ({ kind: "health" as const, date: h.created_at, ...h })),
    ...treatments.map((t) => ({
      kind: "treatment" as const,
      date: t.administered_at,
      ...t,
    })),
    ...vaccinations.map((v) => ({
      kind: "vaccination" as const,
      date: v.administered_at,
      ...v,
    })),
  ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  if (items.length === 0) {
    return <p style={{ color: "var(--text-muted)" }}>No history yet.</p>;
  }

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {items.map((it) => {
        const body = (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
            <strong
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 0.4,
                color: COLORS[it.kind],
              }}
            >
              {LABELS[it.kind]}
            </strong>
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
              {it.date.slice(0, 10)}
            </span>
          </div>

          <div style={{ fontSize: 14, marginTop: 4 }}>
            {it.kind === "health" && (
              <>
                {it.symptoms.length > 0
                  ? it.symptoms.join(", ")
                  : it.notes || "—"}
                <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                  {" "}
                  · {it.status}
                </span>
              </>
            )}
            {it.kind === "treatment" && (
              <>
                {it.medicine ?? "Unknown medicine"}
                {it.dosage && (
                  <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    {" "}
                    · {it.dosage}
                  </span>
                )}
              </>
            )}
            {it.kind === "vaccination" && (
              <>
                {it.vaccinationType ?? "Unknown vaccination"}
                {it.next_due_date && (
                  <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    {" "}
                    · next due {it.next_due_date}
                  </span>
                )}
              </>
            )}
          </div>
          </>
        );

        return (
          <li
            key={`${it.kind}-${it.id}`}
            style={{
              border: "1px solid var(--card-border)",
              borderLeft: `3px solid ${COLORS[it.kind]}`,
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            {it.kind === "health" ? (
              <Link
                href={`/health-events/${it.id}`}
                style={{
                  display: "block",
                  padding: "10px 14px",
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                {body}
              </Link>
            ) : (
              <div style={{ padding: "10px 14px" }}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
