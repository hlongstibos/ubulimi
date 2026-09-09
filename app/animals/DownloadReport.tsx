"use client";

import { useState } from "react";
import type { ReportData } from "./animalReport";

export default function DownloadReport({ data }: { data: ReportData }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    try {
      // @react-pdf/renderer is large and browser-only — pull it in on
      // demand rather than at page load.
      const [{ pdf }, { buildAnimalReport }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./animalReport"),
      ]);
      const blob = await pdf(buildAnimalReport(data)).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.animal.tag_id.replace(/[^\w.-]+/g, "_")}-history.pdf`;
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
          borderRadius: 20,
          border: "1px solid var(--forest)",
          background: "transparent",
          color: "var(--forest)",
          fontWeight: 600,
          fontSize: 13,
          cursor: busy ? "default" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {busy ? "Preparing…" : "Download report"}
      </button>
      {error && (
        <span style={{ color: "#b3413e", fontSize: 12 }}>{error}</span>
      )}
    </span>
  );
}
