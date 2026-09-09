"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Everything except the login screen and the "/" role-redirect is an
// authenticated screen and gets the header.
const HIDDEN = new Set(["/", "/login"]);

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  if (HIDDEN.has(pathname)) return null;

  async function logout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

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
          gap: 12,
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

        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          style={{
            marginLeft: "auto",
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            fontSize: 13,
            fontWeight: 600,
            cursor: loggingOut ? "default" : "pointer",
            padding: 0,
          }}
        >
          {loggingOut ? "Logging out…" : "Log out"}
        </button>
      </div>
    </header>
  );
}
