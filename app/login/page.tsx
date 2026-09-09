"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Demo access: one-tap sign-in for a pilot / demo deployment. Each role's
// credentials come from env vars (referenced literally so Next can inline
// them). If they aren't set, the whole demo section is hidden — nothing
// ships unless a demo deployment opts in. Point these at DEDICATED demo
// accounts with throwaway data, never a real owner account: NEXT_PUBLIC_
// values are readable in the browser bundle.
const DEMO = {
  owner: {
    email: process.env.NEXT_PUBLIC_DEMO_OWNER_EMAIL,
    password: process.env.NEXT_PUBLIC_DEMO_OWNER_PASSWORD,
  },
  worker: {
    email: process.env.NEXT_PUBLIC_DEMO_WORKER_EMAIL,
    password: process.env.NEXT_PUBLIC_DEMO_WORKER_PASSWORD,
  },
} as const;

const demoOwnerReady = Boolean(DEMO.owner.email && DEMO.owner.password);
const demoWorkerReady = Boolean(DEMO.worker.email && DEMO.worker.password);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function signIn(creds: { email: string; password: string }) {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword(creds);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void signIn({ email, password });
  }

  function demoLogin(role: "owner" | "worker") {
    const creds = DEMO[role];
    if (!creds.email || !creds.password) return;
    void signIn({ email: creds.email, password: creds.password });
  }

  return (
    <main style={{ maxWidth: 380, margin: "80px auto", padding: "0 20px" }}>
      <h1 style={{ color: "var(--forest)", marginBottom: 4 }}>UBULIMI</h1>
      <p style={{ color: "var(--text-muted)", marginTop: 0, marginBottom: 32 }}>
        Farm management, from anywhere
      </p>

      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            display: "block",
            width: "100%",
            padding: 10,
            marginBottom: 16,
            border: "1px solid var(--card-border)",
            borderRadius: 6,
          }}
        />

        <label style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            display: "block",
            width: "100%",
            padding: 10,
            marginBottom: 20,
            border: "1px solid var(--card-border)",
            borderRadius: 6,
          }}
        />

        {error && (
          <p style={{ color: "#b3413e", fontSize: 13, marginBottom: 16 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            background: "var(--terracotta)",
            color: "white",
            border: "none",
            borderRadius: 24,
            fontWeight: 600,
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Logging in…" : "Log In"}
        </button>
      </form>

      {demoOwnerReady && (
        <div style={{ marginTop: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "var(--text-muted)",
              fontSize: 11,
              letterSpacing: 0.6,
            }}
          >
            <span style={{ flex: 1, height: 1, background: "var(--card-border)" }} />
            DEMO ACCESS
            <span style={{ flex: 1, height: 1, background: "var(--card-border)" }} />
          </div>

          <p style={{ color: "var(--text-muted)", fontSize: 12, margin: "10px 0 12px" }}>
            Sign in without a password — pick a role.
          </p>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() => demoLogin("owner")}
              disabled={loading}
              style={demoButtonStyle(loading)}
            >
              Owner
            </button>
            {demoWorkerReady && (
              <button
                type="button"
                onClick={() => demoLogin("worker")}
                disabled={loading}
                style={demoButtonStyle(loading)}
              >
                Worker
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function demoButtonStyle(loading: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: "10px 12px",
    background: "transparent",
    color: "var(--forest)",
    border: "1px solid var(--forest)",
    borderRadius: 24,
    fontWeight: 600,
    cursor: loading ? "default" : "pointer",
    opacity: loading ? 0.7 : 1,
  };
}
