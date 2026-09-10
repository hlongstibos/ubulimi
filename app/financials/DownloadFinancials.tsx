"use client";

import { useState } from "react";
import type { FinancialsData } from "./financialsReport";

export default function DownloadFinancials({
  data,
}: {
  data: FinancialsData;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    try {
      const [{ pdf }, { buildFinancialsReport }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./financialsReport"),
      ]);
      const blob = await pdf(buildFinancialsReport(data)).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `financials-${data.periodLabel
        .toLowerCase()
        .replace(/[^\w]+/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      console.error(e);
      setError("Could not generate the report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        style={{
          padding: "6px 14px",
          borderRadius: 999,
          border: "1px solid var(--forest)",
          background: "transparent",
          color: "var(--forest)",
          fontWeight: 600,
          fontSize: 13,
          cursor: busy ? "default" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {busy ? "Preparing…" : "Download PDF"}
      </button>
      {error && <span style={{ color: "#b3413e", fontSize: 12 }}>{error}</span>}
    </span>
  );
}
