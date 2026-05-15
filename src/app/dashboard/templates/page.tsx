/*
-- Run in Supabase: CREATE TABLE IF NOT EXISTS
-- report_templates (id uuid DEFAULT gen_random_uuid()
-- PRIMARY KEY, user_id uuid REFERENCES auth.users(id)
-- ON DELETE CASCADE, name text, content text,
-- type text, created_at timestamptz DEFAULT now());
*/

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@/lib/supabase/client";

type TemplateRow = {
  id: string;
  user_id: string;
  name: string | null;
  content: string | null;
  type: string | null;
  created_at: string | null;
};

export default function TemplatesPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("FCA");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchTemplates = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const res = await fetch("/api/templates");
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Templates fetch failed:", json);
      setTemplates([]);
      setLoading(false);
      return;
    }

    const list = Array.isArray((json as any)?.templates) ? (json as any).templates : [];
    setTemplates(list);
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void fetchTemplates();
    }, 0);
    return () => window.clearTimeout(t);
  }, [fetchTemplates]);

  async function saveTemplate() {
    if (name.trim() === "") {
      setSaveError("Please enter a template name");
      return;
    }
    if (content.trim() === "") return;
    setSaving(true);
    setSaveError(null);
    const { data: { user } } = await supabase.auth.getUser();

    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, content, type }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !(data as any)?.success) {
        console.log("Insert error:", (data as any)?.error || data);
        console.log("Insert data:", data);
        console.log("User:", user?.id);
        throw new Error((data as any)?.error || "Failed to save template");
      }
    } catch (err) {
      console.log("Insert error:", err);
      console.log("Insert data:", null);
      console.log("User:", user?.id);
      console.error("Template save error:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to save template");
      setSaving(false);
      return;
    }

    setName("");
    setContent("");
    await fetchTemplates();
    setSaveSuccess(true);
    window.setTimeout(() => setSaveSuccess(false), 3000);
    setSaving(false);
  }

  async function deleteTemplate(id: string) {
    await fetch(`/api/templates?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 48px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#0A1628", marginBottom: "8px" }}>Templates</h1>
      <p style={{ color: "#6b7280", marginBottom: "32px" }}>Save reusable report templates</p>

      <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "24px", marginBottom: "32px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px", color: "#0A1628" }}>New Template</h2>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (saveError) setSaveError(null);
          }}
          placeholder="Enter template name"
          style={{ width: "100%", padding: "10px", border: "1px solid #e5e7eb", borderRadius: "8px", marginBottom: "12px", fontSize: "14px" }}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ width: "100%", padding: "10px", border: "1px solid #e5e7eb", borderRadius: "8px", marginBottom: "12px", fontSize: "14px" }}
        >
          <option value="FCA">FCA Suitability Report</option>
          <option value="SOA">Australian SOA</option>
          <option value="USA">USA Financial Plan</option>
        </select>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Template content or meeting notes structure..."
          rows={6}
          style={{ width: "100%", padding: "10px", border: "1px solid #e5e7eb", borderRadius: "8px", marginBottom: "12px", fontSize: "14px", resize: "vertical" }}
        />
        <button
          onClick={saveTemplate}
          disabled={saving || name.trim() === "" || content.trim() === ""}
          style={{
            backgroundColor: "#C9A84C",
            color: "#0A1628",
            border: "none",
            padding: "10px 24px",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: saving || name.trim() === "" || content.trim() === "" ? "not-allowed" : "pointer",
            opacity: saving || name.trim() === "" || content.trim() === "" ? 0.7 : 1,
          }}
        >
          {saving ? "Saving..." : "Save Template"}
        </button>
        {saveError && <div style={{ marginTop: "10px", color: "#dc2626", fontSize: "13px", fontWeight: "600" }}>{saveError}</div>}
        {saveSuccess && <div style={{ marginTop: "10px", color: "#16a34a", fontSize: "13px", fontWeight: "700" }}>Template saved!</div>}
      </div>

      {loading ? (
        <p style={{ color: "#6b7280" }}>Loading...</p>
      ) : templates.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No templates yet. Create your first template above.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {templates.map((t: any) => (
            <div
              key={t.id}
              style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ backgroundColor: "#0A1628", color: "white", padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>
                  {String(t.type || "FCA")}
                </span>
                <span style={{ fontWeight: "600", color: "#0A1628" }}>{String(t.name || "Untitled template")}</span>
              </div>
              <button
                onClick={() => deleteTemplate(t.id)}
                style={{ backgroundColor: "transparent", color: "#dc2626", border: "1px solid #dc2626", padding: "6px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
