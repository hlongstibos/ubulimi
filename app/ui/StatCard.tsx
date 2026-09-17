"use client";

import Link from "next/link";

const cardStyle: React.CSSProperties = {
  display: "block",
  border: "1px solid var(--card-border)",
  borderRadius: 12,
  padding: "14px 16px",
  background: "#fff",
  boxShadow: "var(--card-shadow)",
  textDecoration: "none",
  color: "inherit",
  cursor: "pointer",
};

export default function StatCard({
  label,
  value,
  href,
  sectionId,
}: {
  label: string;
  value: number;
  /** Navigate to another route. */
  href?: string;
  /** Expand and scroll to a <Collapsible id=…> further down this page. */
  sectionId?: string;
}) {
  const body = (
    <>
      <div style={{ fontSize: 30, fontWeight: 800, color: "var(--terracotta)" }}>
        {value}
      </div>
      <div style={{ color: "var(--text-muted)", fontSize: 12.5, marginTop: 2 }}>
        {label}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} style={cardStyle}>
        {body}
      </Link>
    );
  }

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!sectionId) return;
    const el = document.getElementById(sectionId);
    if (!el) return;
    e.preventDefault();
    if (el instanceof HTMLDetailsElement) el.open = true;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <a
      href={sectionId ? `#${sectionId}` : undefined}
      onClick={handleClick}
      style={cardStyle}
    >
      {body}
    </a>
  );
}
