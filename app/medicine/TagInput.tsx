"use client";

import { useState, type KeyboardEvent } from "react";

const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  background: "var(--moss)",
  color: "white",
  borderRadius: 14,
  padding: "3px 6px 3px 10px",
  fontSize: 13,
};

export default function TagInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const t = draft.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        padding: 6,
        border: "1px solid var(--card-border)",
        borderRadius: 6,
        background: "#fff",
        minHeight: 40,
      }}
    >
      {value.map((tag) => (
        <span key={tag} style={chipStyle}>
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            onClick={() => onChange(value.filter((t) => t !== tag))}
            style={{
              border: "none",
              background: "transparent",
              color: "white",
              cursor: "pointer",
              fontSize: 15,
              lineHeight: 1,
              padding: 0,
            }}
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder={value.length === 0 ? "Type a condition, press Enter" : ""}
        style={{
          flex: 1,
          minWidth: 150,
          border: "none",
          outline: "none",
          padding: "4px 2px",
          fontSize: 14,
          background: "transparent",
        }}
      />
    </div>
  );
}
