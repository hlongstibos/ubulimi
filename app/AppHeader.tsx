"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Everything except the login screen and the "/" role-redirect is an
// authenticated screen and gets the header.
const HIDDEN = new Set(["/", "/login"]);

export default function AppHeader() {
  const pathname = usePathname();
  if (HIDDEN.has(pathname)) return null;

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "#fff",
        borderBottom: "1px solid var(--card-border)",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Link
          href="/"
          aria-label="Home"
          style={{
            color: "var(--forest)",
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: 0.5,
            textDecoration: "none",
          }}
        >
          UBULIMI
        </Link>
      </div>
    </header>
  );
}
