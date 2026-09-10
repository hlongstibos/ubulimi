"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Item = { href: string; label: string };
type Group = { key: string; label: string; items: Item[]; ownerOnly?: boolean };

const GROUPS: Group[] = [
  {
    key: "log",
    label: "Log",
    items: [
      { href: "/log-event", label: "Health event" },
      { href: "/log-vaccination", label: "Vaccination" },
      { href: "/log-feeding", label: "Feeding" },
    ],
  },
  {
    key: "herd",
    label: "Herd",
    items: [
      { href: "/animals", label: "Animals" },
      { href: "/camps", label: "Camps" },
    ],
  },
  {
    key: "stock",
    label: "Stock",
    items: [
      { href: "/medicine", label: "Medicine" },
      { href: "/feed", label: "Feed" },
    ],
  },
  {
    key: "setup",
    label: "Setup",
    ownerOnly: true,
    items: [{ href: "/vaccination-types", label: "Vaccination types" }],
  },
];

const STANDALONE: (Item & { ownerOnly?: boolean })[] = [
  { href: "/financials", label: "Financials", ownerOnly: true },
];

function pillStyle(active: boolean, open = false): React.CSSProperties {
  return {
    flex: "0 0 auto",
    padding: "7px 13px",
    borderRadius: 999,
    border: `1px solid ${active || open ? "var(--forest)" : "var(--card-border)"}`,
    background: active ? "var(--forest)" : "#fff",
    color: active ? "#fff" : "var(--forest)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  };
}

export default function Nav({
  role,
  exclude = [],
}: {
  role: string;
  exclude?: string[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(null), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const groups = GROUPS.filter((g) => !g.ownerOnly || role === "owner")
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => !exclude.includes(i.href)),
    }))
    .filter((g) => g.items.length > 0);

  const standalone = STANDALONE.filter((s) => !s.ownerOnly || role === "owner");

  return (
    <nav
      ref={ref}
      style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}
    >
      {groups.map((g) => {
        const active = g.items.some((i) => i.href === pathname);
        const isOpen = open === g.key;
        return (
          <div key={g.key} style={{ position: "relative" }}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : g.key)}
              style={pillStyle(active, isOpen)}
            >
              {g.label}
              <span
                style={{
                  fontSize: 9,
                  transform: isOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.12s ease",
                }}
              >
                ▾
              </span>
            </button>

            {isOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  zIndex: 30,
                  minWidth: 170,
                  maxWidth: "calc(100vw - 40px)",
                  background: "#fff",
                  border: "1px solid var(--card-border)",
                  borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(38,48,31,0.14)",
                  padding: 6,
                }}
              >
                {g.items.map((i) => {
                  const on = i.href === pathname;
                  return (
                    <Link
                      key={i.href}
                      href={i.href}
                      onClick={() => setOpen(null)}
                      style={{
                        display: "block",
                        padding: "8px 10px",
                        borderRadius: 7,
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: on ? "var(--forest)" : "var(--text-dark)",
                        background: on ? "var(--light-bg)" : "transparent",
                        textDecoration: "none",
                      }}
                    >
                      {i.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {standalone.map((s) => (
        <Link key={s.href} href={s.href} style={pillStyle(s.href === pathname)}>
          {s.label}
        </Link>
      ))}
    </nav>
  );
}
