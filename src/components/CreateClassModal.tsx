"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { generateJoinCode } from "@/lib/utils";

interface Teacher {
  id: string;
  name: string;
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateClassModal({ onClose, onCreated }: Props) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [name, setName] = useState("");
  const [section, setSection] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [joinCode, setJoinCode] = useState(generateJoinCode());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("users")
      .select("id, name")
      .eq("role", "teacher")
      .order("name")
      .then(({ data }) => setTeachers((data as Teacher[]) ?? []));
  }, []);

  async function handleSubmit() {
    if (!name.trim() || !section.trim() || !teacherId || !joinCode.trim()) {
      setError("All fields are required.");
      return;
    }

    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from("classes").insert({
      name: name.trim(),
      section: section.trim(),
      teacher_id: teacherId,
      join_code: joinCode.trim().toUpperCase(),
    });

    if (insertError) {
      setError(
        insertError.message.includes("unique")
          ? "That join code is already taken. Try a different one."
          : insertError.message,
      );
      setSaving(false);
      return;
    }

    onCreated();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "2rem",
          width: "100%",
          maxWidth: "460px",
          boxShadow: "0 8px 40px rgba(13,61,32,0.15)",
        }}
      >
        <h2
          style={{
            fontFamily: "'Lora', serif",
            fontSize: "1.4rem",
            fontWeight: 700,
            color: "#0d3d20",
            margin: "0 0 1.5rem",
          }}
        >
          Create New Class
        </h2>

        {error && (
          <div
            style={{
              background: "#fff0f0",
              border: "1.5px solid rgba(155,28,28,0.18)",
              borderRadius: "10px",
              padding: "0.75rem 1rem",
              color: "#8b1a1a",
              fontSize: "0.88rem",
              marginBottom: "1rem",
            }}
          >
            {error}
          </div>
        )}

        {[
          {
            label: "Class Name",
            value: name,
            setter: setName,
            placeholder: "e.g. Grade 7 English",
          },
          {
            label: "Section",
            value: section,
            setter: setSection,
            placeholder: "e.g. Sampaguita",
          },
        ].map(({ label, value, setter, placeholder }) => (
          <div key={label} style={{ marginBottom: "1.1rem" }}>
            <label style={labelStyle}>{label}</label>
            <input
              type="text"
              value={value}
              onChange={(e) => setter(e.target.value)}
              placeholder={placeholder}
              style={inputStyle}
            />
          </div>
        ))}

        <div style={{ marginBottom: "1.1rem" }}>
          <label style={labelStyle}>Assign Teacher</label>
          <select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            style={inputStyle}
          >
            <option value="">Select a teacher…</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={labelStyle}>Join Code</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={10}
              style={{
                ...inputStyle,
                flex: 1,
                fontFamily: "monospace",
                letterSpacing: "0.1em",
              }}
            />
            <button
              onClick={() => setJoinCode(generateJoinCode())}
              style={{
                background: "#eaf6ef",
                border: "1.5px solid rgba(26,122,64,0.2)",
                borderRadius: "8px",
                padding: "0 0.9rem",
                color: "#0d3d20",
                fontWeight: 700,
                fontSize: "0.8rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Regenerate
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: "#fff",
              border: "1.5px solid rgba(26,122,64,0.2)",
              borderRadius: "10px",
              padding: "0.72rem",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: "pointer",
              color: "#0d3d20",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              flex: 1,
              background: saving ? "#6b7280" : "#0d3d20",
              color: "#ffd166",
              border: "none",
              borderRadius: "10px",
              padding: "0.72rem",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Creating…" : "Create Class"}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 700,
  color: "#0d3d20",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: "0.4rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.65rem 0.9rem",
  borderRadius: "8px",
  border: "1.5px solid rgba(26,122,64,0.2)",
  fontSize: "0.95rem",
  color: "#1a1f16",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};
