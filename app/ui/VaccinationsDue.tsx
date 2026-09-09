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
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
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
              padding: "10px 14px",
              marginBottom: 8,
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
          </li>
        );
      })}
    </ul>
  );
}
