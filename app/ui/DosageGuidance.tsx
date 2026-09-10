import Link from "next/link";

function fmt(n: number): string {
  return n.toLocaleString("en-ZA", { maximumFractionDigits: 2 });
}

/**
 * Label-based dosage guidance for a medicine + animal. Renders on every
 * card/form where a dose is being entered — the "reference only" line is
 * always shown, calculated or not.
 */
export default function DosageGuidance({
  medicineId,
  dosePerKg,
  doseUnit,
  labelText,
  weightKg,
  animalId,
}: {
  medicineId: string;
  dosePerKg: number | null;
  doseUnit: string | null;
  labelText: string | null;
  weightKg: number | null;
  animalId: string | null;
}) {
  const hasLabelDose =
    dosePerKg != null && doseUnit != null && doseUnit !== "";
  const calc = hasLabelDose && weightKg != null ? dosePerKg! * weightKg : null;

  const noteStyle: React.CSSProperties = {
    margin: "0 0 4px",
    fontSize: 12,
    color: "var(--text-muted)",
  };
  const linkStyle: React.CSSProperties = {
    color: "var(--forest)",
    fontWeight: 600,
  };

  return (
    <div style={{ marginTop: 10, fontSize: 13 }}>
      {calc != null ? (
        <p
          style={{ margin: "0 0 4px", fontWeight: 700, color: "var(--forest)" }}
        >
          Suggested: {fmt(calc)} {doseUnit}{" "}
          <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>
            (from label &times; this animal&rsquo;s estimated weight)
          </span>
        </p>
      ) : (
        <p style={noteStyle}>
          No calculated dose &mdash;{" "}
          {!hasLabelDose && weightKg == null ? (
            <>
              add this medicine&rsquo;s per-kg dose &amp; unit on the{" "}
              <Link href={`/medicine/${medicineId}`} style={linkStyle}>
                medicine page
              </Link>
              , and set the animal&rsquo;s estimated weight on its{" "}
              {animalId ? (
                <Link href={`/animals/${animalId}`} style={linkStyle}>
                  detail page
                </Link>
              ) : (
                "detail page"
              )}
              .
            </>
          ) : !hasLabelDose ? (
            <>
              add this medicine&rsquo;s per-kg dose &amp; unit on the{" "}
              <Link href={`/medicine/${medicineId}`} style={linkStyle}>
                medicine page
              </Link>
              .
            </>
          ) : (
            <>
              set this animal&rsquo;s estimated weight on its{" "}
              {animalId ? (
                <Link href={`/animals/${animalId}`} style={linkStyle}>
                  detail page
                </Link>
              ) : (
                "detail page"
              )}
              .
            </>
          )}
        </p>
      )}

      {labelText ? (
        <p
          style={{
            margin: "0 0 4px",
            padding: "6px 10px",
            background: "var(--light-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: 6,
            whiteSpace: "pre-wrap",
            color: "var(--text-dark)",
          }}
        >
          <span
            style={{
              display: "block",
              fontSize: 11,
              color: "var(--text-muted)",
            }}
          >
            From the label
          </span>
          {labelText}
        </p>
      ) : (
        <p style={noteStyle}>
          No label dosage instructions on file &mdash; add them on the{" "}
          <Link href={`/medicine/${medicineId}`} style={linkStyle}>
            medicine page
          </Link>
          .
        </p>
      )}

      <p
        style={{
          margin: 0,
          color: "var(--terracotta)",
          fontWeight: 600,
          fontSize: 12,
        }}
      >
        Reference only &mdash; confirm with a vet or animal health technician
        before administering.
      </p>
    </div>
  );
}
