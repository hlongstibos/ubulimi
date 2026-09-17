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
      { href: "/health-events", label: "Health events" },
      { href: "/vaccinations", label: "Vaccinations" },
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

export default function Nav({
  role,
  exclude = [],
}: {
  role: string;
  exclude?: string[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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

  const active =
    groups.some((g) => g.items.some((i) => i.href === pathname)) ||
    standalone.some((s) => s.href === pathname);

  return (
    <div ref={ref} style={{ position: "relative", marginBottom: 18 }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          padding: "7px 14px",
          borderRadius: 999,
          border: `1px solid ${active || open ? "var(--forest)" : "var(--card-border)"}`,
          background: active ? "var(--forest)" : "#fff",
          color: active ? "#fff" : "var(--forest)",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        <span aria-hidden style={{ fontSize: 13, lineHeight: 1 }}>
          ☰
        </span>
        Menu
        <span
          aria-hidden
          style={{
            fontSize: 9,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.12s ease",
          }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 30,
            minWidth: 210,
            maxWidth: "calc(100vw - 40px)",
            background: "#fff",
            border: "1px solid var(--card-border)",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(38,48,31,0.14)",
            padding: 8,
          }}
        >
          {groups.map((g, gi) => (
            <div
              key={g.key}
              style={{
                paddingTop: gi === 0 ? 0 : 8,
                marginTop: gi === 0 ? 0 : 8,
                borderTop: gi === 0 ? "none" : "1px solid var(--card-border)",
              }}
            >
              <div
                style={{
                  padding: "2px 10px 4px",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  color: "var(--text-muted)",
                }}
              >
                {g.label}
              </div>
              {g.items.map((i) => {
                const on = i.href === pathname;
                return (
                  <Link
                    key={i.href}
                    href={i.href}
                    onClick={() => setOpen(false)}
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
          ))}

          {standalone.length > 0 && (
            <div
              style={{
                paddingTop: 8,
                marginTop: 8,
                borderTop: "1px solid var(--card-border)",
              }}
            >
              {standalone.map((s) => {
                const on = s.href === pathname;
                return (
                  <Link
                    key={s.href}
                    href={s.href}
                    onClick={() => setOpen(false)}
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
                    {s.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
