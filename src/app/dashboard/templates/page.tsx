"use client";

import { useState, useEffect } from "react";
import { Layout, Loader2, Plus, Trash2, Edit3, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type TemplateType = "fca" | "soa" | "usa";

type Template = {
  id: string;
  name: string;
  content: string;
  type: TemplateType;
  created_at: string;
};

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState<string | undefined>();
  
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState<TemplateType>("fca");

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editType, setEditType] = useState<TemplateType>("fca");

  useEffect(() => {
    async function checkAccess() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      setUserEmail(user.email);

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscribed")
        .eq("id", user.id)
        .single();

      if (!profile?.subscribed) {
        router.push("/pricing?message=subscribe");
        return;
      }
      
      await fetchTemplates();
      setIsLoading(false);
    }
    checkAccess();
  }, [router]);

  async function fetchTemplates() {
    try {
      const response = await fetch("/api/templates");
      const data = await response.json();
      if (response.ok) setTemplates(data);
    } catch (err) {
      console.error("Failed to fetch templates", err);
    }
  }

  function openCreate() {
    setIsEditing(false);
    setEditId(null);
    setEditName("");
    setEditContent("");
    setEditType("fca");
    setNewName("");
    setNewContent("");
    setNewType("fca");
    setError("");
    setIsCreating(true);
  }

  function openEdit(t: Template) {
    setIsCreating(false);
    setNewName("");
    setNewContent("");
    setNewType("fca");
    setError("");
    setIsEditing(true);
    setEditId(t.id);
    setEditName(t.name || "");
    setEditContent(t.content || "");
    setEditType(t.type || "fca");
  }

  function closeForm() {
    setIsCreating(false);
    setIsEditing(false);
    setEditId(null);
    setError("");
  }

  async function handleCreateTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName || !newContent) return;
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, content: newContent, type: newType }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to save template");
      }

      setNewName("");
      setNewContent("");
      setNewType("fca");
      setIsCreating(false);
      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!editId || !editName || !editContent) return;
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editId, name: editName, content: editContent, type: editType }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to update template");
      }

      closeForm();
      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm("Are you sure you want to delete this template?")) return;
    
    try {
      const res = await fetch(`/api/templates?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await fetchTemplates();
    } catch (err) {
      console.error("Delete failed", err);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#c1a362]" size={48} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 48px", display: "flex", flexDirection: "column", gap: "24px", backgroundColor: "white", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", margin: 0 }}>
            Custom Templates
          </h1>
          <p style={{ color: "#64748B", margin: 0 }}>
            Manage your custom report structures and building blocks.
          </p>
        </div>
        {!isCreating && (
          <button 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px", 
              backgroundColor: "#0A1628", 
              color: "white", 
              padding: "12px 24px", 
              borderRadius: "8px", 
              fontWeight: "700", 
              fontSize: "14px",
              border: "none",
              cursor: "pointer",
              transition: "background-color 0.2s"
            }} 
            onClick={openCreate}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1a2a40"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#0A1628"}
          >
            <Plus size={18} />
            New Template
          </button>
        )}
      </div>

            {(isCreating || isEditing) && (
              <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "32px", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <form onSubmit={isEditing ? handleUpdateTemplate : handleCreateTemplate} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0A1628", margin: 0 }}>
                      {isEditing ? "Edit Template" : "Create New Template"}
                    </h3>
                    <button type="button" onClick={closeForm} style={{ color: "#64748B", cursor: "pointer" }}>
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="field">
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase" }}>Template Name</label>
                    <input
                      className="input"
                      placeholder="e.g. Standard Pension Review"
                      value={isEditing ? editName : newName}
                      onChange={(e) => (isEditing ? setEditName(e.target.value) : setNewName(e.target.value))}
                      required
                      style={{ padding: "12px", borderRadius: "8px", border: "1px solid #E5E7EB" }}
                    />
                  </div>

                  <div className="field">
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase" }}>Template Type</label>
                    <select
                      value={isEditing ? editType : newType}
                      onChange={(e) => {
                        const v = e.target.value as TemplateType;
                        if (isEditing) setEditType(v);
                        else setNewType(v);
                      }}
                      style={{ padding: "12px", borderRadius: "8px", border: "1px solid #E5E7EB", backgroundColor: "white" }}
                    >
                      <option value="fca">FCA</option>
                      <option value="soa">SOA</option>
                      <option value="usa">USA</option>
                    </select>
                  </div>

                  <div className="field">
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase" }}>Structure / Boilerplate Text</label>
                    <textarea
                      className="textarea"
                      placeholder="Paste your report structure or boilerplate text here..."
                      value={isEditing ? editContent : newContent}
                      onChange={(e) => (isEditing ? setEditContent(e.target.value) : setNewContent(e.target.value))}
                      required
                      style={{ padding: "12px", borderRadius: "8px", border: "1px solid #E5E7EB", minHeight: "200px", resize: "vertical" }}
                    />
                  </div>

                  {error && <div className="alert alert-error">{error}</div>}

                  <button 
                    type="submit" 
                    disabled={isSaving}
                    style={{ 
                      backgroundColor: "#0A1628", 
                      color: "white", 
                      padding: "14px", 
                      borderRadius: "8px", 
                      fontWeight: "700", 
                      fontSize: "14px", 
                      border: "none", 
                      cursor: isSaving ? "not-allowed" : "pointer", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      gap: "8px",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => { if (!isSaving) e.currentTarget.style.backgroundColor = "#1a2a40"; }}
                    onMouseLeave={(e) => { if (!isSaving) e.currentTarget.style.backgroundColor = "#0A1628"; }}
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {isEditing ? "Save Changes" : "Save Template"}
                  </button>
                </form>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
              {templates.length > 0 ? (
                templates.map((template) => (
                  <div key={template.id} style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#0A1628", margin: 0 }}>{template.name}</h4>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "10px", fontWeight: "800", padding: "4px 8px", borderRadius: "999px", backgroundColor: "#FFFBEB", border: "1px solid #FEF3C7", color: "#C9A84C", letterSpacing: "0.08em" }}>
                            {template.type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <button onClick={() => openEdit(template)} style={{ color: "#94A3B8", cursor: "pointer" }} aria-label="Edit template">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => handleDeleteTemplate(template.id)} style={{ color: "#94A3B8", cursor: "pointer" }} aria-label="Delete template">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: "13px", color: "#64748B", margin: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.5", fontStyle: "italic" }}>
                      {template.content}
                    </p>
                    <div style={{ fontSize: "10px", color: "#94A3B8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "auto" }}>
                      Added {new Date(template.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : !isCreating && (
                <div style={{ gridColumn: "1/-1", padding: "80px 0", textAlign: "center", backgroundColor: "#F8FAFC", borderRadius: "12px", border: "1px dashed #E5E7EB" }}>
                  <Layout size={48} color="#CBD5E1" style={{ marginBottom: "16px" }} />
                  <p style={{ color: "#64748B", margin: 0 }}>No templates saved yet. Create your first one to get started.</p>
                </div>
              )}
            </div>
          </div>
  );
}
