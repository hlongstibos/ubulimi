import Link from "next/link";

export type DueRow = {
  animal_id: string;
  tag_id: string;
  species: string;
  vaccination_type_name: string;
  reason: "initial" | "booster";
  due_date: string | null;
};

function describe(row: DueRow, today: number): { text: string; urgent: boolean } {
  if (row.reason === "initial") {
    return { text: "Initial dose due", urgent: true };
  }
  if (!row.due_date) {
    return { text: "Due", urgent: true };
  }
  const days = Math.round(
    (new Date(row.due_date + "T00:00:00").getTime() - today) / 86_400_000
  );
  if (days < 0) {
    return {
      text: `Overdue by ${-days} day${-days === 1 ? "" : "s"}`,
      urgent: true,
    };
  }
  if (days === 0) return { text: "Due today", urgent: true };
  return { text: `Due in ${days} day${days === 1 ? "" : "s"}`, urgent: false };
}

export default function VaccinationsDue({ rows }: { rows: DueRow[] }) {
  if (rows.length === 0) {
    return <p style={{ color: "var(--text-muted)" }}>Nothing due.</p>;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  return (
    <details style={{ border: "1px solid var(--card-border)", borderRadius: 8 }}>
      <summary
        style={{
          cursor: "pointer",
          padding: "11px 14px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 14,
        }}
      >
        <span className="vd-caret" style={{ color: "var(--text-muted)" }}>
          ▸
        </span>
        <strong style={{ color: "var(--terracotta)" }}>{rows.length}</strong>
        <span>due &amp; overdue</span>
        <span
          style={{
            marginLeft: "auto",
            color: "var(--text-muted)",
            fontSize: 12,
          }}
        >
          tap to view
        </span>
      </summary>

      <ul style={{ listStyle: "none", padding: "0 10px 10px", margin: 0 }}>
        {rows.map((r, i) => {
          const { text, urgent } = describe(r, todayMs);
          return (
            <li
              key={`${r.animal_id}-${r.vaccination_type_name}-${i}`}
              style={{
                border: "1px solid var(--card-border)",
                borderLeft: `3px solid ${
                  urgent ? "var(--terracotta)" : "var(--moss)"
                }`,
                borderRadius: 8,
                marginTop: 8,
              }}
            >
              <Link
                href="/log-vaccination"
                style={{
                  display: "block",
                  padding: "10px 14px",
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                <strong>{r.tag_id}</strong>{" "}
                <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                  {r.species}
                </span>
                <div style={{ fontSize: 13, marginTop: 2 }}>
                  {r.vaccination_type_name} —{" "}
                  <span
                    style={{
                      color: urgent ? "var(--terracotta)" : "var(--text-muted)",
                      fontWeight: urgent ? 600 : 400,
                    }}
                  >
                    {text}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
