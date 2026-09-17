import Link from "next/link";

export default function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        border: "1px solid var(--card-border)",
        borderRadius: 12,
        padding: "14px 16px",
        background: "#fff",
        boxShadow: "var(--card-shadow)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ fontSize: 30, fontWeight: 800, color: "var(--terracotta)" }}>
        {value}
      </div>
      <div style={{ color: "var(--text-muted)", fontSize: 12.5, marginTop: 2 }}>
        {label}
      </div>
    </Link>
  );
}
