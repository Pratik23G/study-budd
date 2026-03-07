"use client";

import { useState } from "react";

export default function GenerateQuizModal({ folders, onGenerate, onClose }) {
  const [folderId, setFolderId] = useState("");
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(10);
  const [generating, setGenerating] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setGenerating(true);
    try {
      await onGenerate({ folderId, topic, numQuestions });
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={() => !generating && onClose()}
    >
      <div
        style={{ background: "#1e2030", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", width: "100%", maxWidth: 440, margin: "0 16px", overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc" }}>Generate Quiz</h2>
          <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 4 }}>Create questions from your uploaded documents.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>Folder (optional)</label>
            <select
              value={folderId} onChange={(e) => setFolderId(e.target.value)}
              style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e2e8f0", padding: "10px 12px", fontSize: "0.85rem", fontFamily: "Sora, sans-serif" }}
            >
              <option value="">All documents</option>
              {folders.map((f) => (<option key={f.id} value={f.id}>{f.name}</option>))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>Topic prompt</label>
            <input
              type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Photosynthesis, Chapter 3"
              style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e2e8f0", padding: "10px 12px", fontSize: "0.85rem", fontFamily: "Sora, sans-serif" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>Questions: {numQuestions}</label>
            <input type="range" min={3} max={30} value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} style={{ width: "100%", accentColor: "#3b82f6" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#475569", marginTop: 4 }}><span>3</span><span>30</span></div>
          </div>

          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={onClose} disabled={generating} className="qz-tbtn" style={{ flex: 1, padding: "10px", borderRadius: 12, background: "rgba(255,255,255,0.06)", color: "#94a3b8", fontSize: "0.85rem", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "Sora, sans-serif", cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={generating} className="qz-tbtn" style={{ flex: 1, padding: "10px", borderRadius: 12, background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "#fff", fontSize: "0.85rem", opacity: generating ? 0.5 : 1, border: "none", fontFamily: "Sora, sans-serif", cursor: "pointer" }}>
              {generating ? "Generating..." : "Generate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
