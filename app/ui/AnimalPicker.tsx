"use client";

import { useState } from "react";

export type PickableAnimal = { id: string; tag_id: string; species: string };

const fieldStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: 10,
  border: "1px solid var(--card-border)",
  borderRadius: 6,
  background: "#fff",
};

export default function AnimalPicker({
  animals,
  value,
  onChange,
}: {
  animals: PickableAnimal[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const selected = animals.find((a) => a.id === value) ?? null;
  const q = query.trim().toLowerCase();
  const matches = q
    ? animals.filter((a) => a.tag_id.toLowerCase().includes(q)).slice(0, 8)
    : [];

  if (selected) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          border: "1px solid var(--card-border)",
          borderRadius: 6,
          padding: "8px 12px",
          background: "#fff",
        }}
      >
        <strong>{selected.tag_id}</strong>
        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
          {selected.species}
        </span>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setQuery("");
          }}
          style={{
            marginLeft: "auto",
            background: "transparent",
            border: "none",
            color: "var(--terracotta)",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by tag ID"
        style={fieldStyle}
      />
      {matches.length > 0 && (
        <ul
          style={{
            listStyle: "none",
            margin: "6px 0 0",
            padding: 0,
            border: "1px solid var(--card-border)",
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          {matches.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => onChange(a.id)}
                style={{
                  display: "flex",
                  gap: 8,
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 12px",
                  border: "none",
                  borderBottom: "1px solid var(--card-border)",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                <strong>{a.tag_id}</strong>
                <span style={{ color: "var(--text-muted)" }}>{a.species}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {q && matches.length === 0 && (
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: 13,
            margin: "6px 0 0",
          }}
        >
          No animal with a tag containing “{query.trim()}”.
        </p>
      )}
    </>
  );
}
