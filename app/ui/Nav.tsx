import Link from "next/link";

const ITEMS: { href: string; label: string; ownerOnly?: boolean }[] = [
  { href: "/log-event", label: "Log event" },
  { href: "/log-vaccination", label: "Log vaccination" },
  { href: "/log-feeding", label: "Log feeding" },
  { href: "/animals", label: "Animals" },
  { href: "/camps", label: "Camps" },
  { href: "/medicine", label: "Medicine" },
  { href: "/feed", label: "Feed" },
  { href: "/vaccination-types", label: "Vaccination types", ownerOnly: true },
];

export default function Nav({
  role,
  exclude = [],
}: {
  role: string;
  exclude?: string[];
}) {
  const items = ITEMS.filter(
    (i) => (!i.ownerOnly || role === "owner") && !exclude.includes(i.href)
  );

  return (
    <nav
      style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        padding: "2px 0 12px",
        marginBottom: 18,
      }}
    >
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          style={{
            flex: "0 0 auto",
            padding: "7px 13px",
            borderRadius: 999,
            border: "1px solid var(--card-border)",
            background: "#fff",
            color: "var(--forest)",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
