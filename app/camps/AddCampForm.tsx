"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AddCampForm({ farmId }: { farmId: string }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { error } = await supabase
      .from("camps")
      .insert({ farm_id: farmId, name: name.trim() });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setName("");
    setSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Camp name"
          required
          style={{
            flex: 1,
            padding: 10,
            border: "1px solid var(--card-border)",
            borderRadius: 6,
          }}
        />
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "10px 18px",
            background: "var(--terracotta)",
            color: "white",
            border: "none",
            borderRadius: 24,
            fontWeight: 600,
            cursor: saving ? "default" : "pointer",
            opacity: saving ? 0.7 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {saving ? "Adding…" : "Add camp"}
        </button>
      </div>
      {error && (
        <p style={{ color: "#b3413e", fontSize: 13, marginBottom: 0 }}>{error}</p>
      )}
    </form>
  );
}
