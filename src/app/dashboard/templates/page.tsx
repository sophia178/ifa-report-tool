"use client";

import { useState, useEffect } from "react";
import { Layout, Loader2, Plus, Trash2, Edit3, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Template = {
  id: string;
  name: string;
  content: string;
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

  async function handleCreateTemplate(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, content: newContent }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save template");

      setNewName("");
      setNewContent("");
      setIsCreating(false);
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
      const supabase = createClient();
      const { error } = await supabase.from("report_templates").delete().eq("id", id);
      if (error) throw error;
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
    <div className="stack gap-8">
      <div className="flex justify-between items-center">
        <div className="stack gap-2">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Layout className="text-[#c1a362]" />
            Report Templates
          </h2>
          <p className="text-gray-400">
            Manage your custom report structures and boilerplate text.
          </p>
        </div>
        {!isCreating && (
          <button className="btn" onClick={() => setIsCreating(true)}>
            <Plus size={18} className="mr-2" />
            New Template
          </button>
        )}
      </div>

            {isCreating && (
              <div className="card border border-[#c1a362]/30 bg-[rgba(15,23,40,0.5)] p-8 fade-in">
                <form onSubmit={handleCreateTemplate} className="stack gap-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">Create New Template</h3>
                    <button type="button" onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-white">
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="field">
                    <label className="text-sm font-medium text-gray-400">Template Name</label>
                    <input
                      className="input"
                      placeholder="e.g. Standard Pension Review"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="field">
                    <label className="text-sm font-medium text-gray-400">Structure / Boilerplate Text</label>
                    <textarea
                      className="textarea min-h-[300px]"
                      placeholder="Paste your report structure or boilerplate text here..."
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      required
                    />
                  </div>

                  {error && <div className="alert alert-error">{error}</div>}

                  <button type="submit" className="btn w-full" disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />}
                    Save Template
                  </button>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.length > 0 ? (
                templates.map((template) => (
                  <div key={template.id} className="card border border-[rgba(193,163,98,0.1)] bg-[rgba(15,23,40,0.3)] p-6 hover:border-[#c1a362]/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-bold text-gray-200">{template.name}</h4>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleDeleteTemplate(template.id)} className="text-gray-500 hover:text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-4 italic mb-4">
                      {template.content}
                    </p>
                    <div className="text-[10px] text-gray-600 uppercase tracking-widest">
                      Added {new Date(template.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : !isCreating && (
                <div className="col-span-full py-20 text-center border border-dashed border-[rgba(193,163,98,0.2)] rounded-2xl">
                  <p className="text-gray-500">No templates saved yet. Create your first one to get started.</p>
                </div>
              )}
            </div>
          </div>
  );
}
