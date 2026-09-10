export default function Collapsible({
  title,
  count,
  accent = "var(--forest)",
  defaultOpen = false,
  children,
}: {
  title: string;
  count?: number;
  accent?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen || undefined}
      style={{
        border: "1px solid var(--card-border)",
        borderRadius: 12,
        background: "#fff",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <summary
        style={{
          cursor: "pointer",
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 14,
          fontWeight: 600,
          borderRadius: 12,
        }}
      >
        <span className="vd-caret" style={{ color: "var(--text-muted)" }}>
          ▸
        </span>
        <span>{title}</span>
        {count != null && (
          <span
            style={{
              marginLeft: "auto",
              minWidth: 20,
              textAlign: "center",
              background: count > 0 ? accent : "var(--card-border)",
              color: count > 0 ? "#fff" : "var(--text-muted)",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              padding: "1px 8px",
            }}
          >
            {count}
          </span>
        )}
      </summary>
      <div style={{ padding: "2px 12px 12px" }}>{children}</div>
    </details>
  );
}
