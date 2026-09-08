"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
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
          {loading ? "Logging in\u2026" : "Log In"}
        </button>
      </form>
    </main>
  );
}
