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
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      // AppHeader lives in the root layout and never unmounts — it just
      // renders null while hidden — so this flag has to be reset by hand.
      // Otherwise it stays stuck at true from this logout and shows
      // "Logging out…" (button disabled) the next time someone signs
      // back in, even though they're no longer logging out.
      setLoggingOut(false);
    }
  }

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "rgba(255,255,255,0.9)",
        backdropFilter: "saturate(160%) blur(6px)",
        borderBottom: "1px solid var(--card-border)",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "11px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Link
          href="/"
          aria-label="Home"
          style={{
            // A solid badge, not plain text sized to match the button —
            // it pops instead of needing to "align" with anything.
            display: "inline-block",
            background: "var(--forest)",
            color: "#fff",
            fontWeight: 800,
            fontSize: 15,
            letterSpacing: 1.2,
            textDecoration: "none",
            lineHeight: 1,
            padding: "7px 12px",
            borderRadius: 8,
            boxShadow: "0 2px 6px rgba(44, 95, 45, 0.28)",
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
            border: "1px solid var(--card-border)",
            borderRadius: 999,
            color: "var(--text-muted)",
            fontSize: 12,
            fontWeight: 600,
            cursor: loggingOut ? "default" : "pointer",
            padding: "6px 14px",
            whiteSpace: "nowrap",
          }}
        >
          {loggingOut ? "Logging out…" : "Log out"}
        </button>
      </div>
    </header>
  );
}
