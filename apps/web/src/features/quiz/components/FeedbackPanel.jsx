import { useEffect, useState } from "react";

export default function FeedbackPanel({ question, pickedLabel, onNext, isLast }) {
  const isCorrect = pickedLabel === question.correct_option;
  const correctText = question.options.find((o) => o.label === question.correct_option)?.text || "";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        marginTop: "1.25rem", borderRadius: 16,
        border: `1.5px solid ${isCorrect ? "#166534" : "#991b1b"}`,
        background: isCorrect
          ? "linear-gradient(135deg, rgba(20,83,45,0.6) 0%, rgba(21,128,61,0.4) 100%)"
          : "linear-gradient(135deg, rgba(127,29,29,0.6) 0%, rgba(153,27,27,0.4) 100%)",
        padding: "1.25rem 1.4rem",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(14px)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
        backdropFilter: "blur(8px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: "0.85rem" }}>
        <div
          style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: isCorrect ? "#22c55e" : "#ef4444",
            animation: "qzPopIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both",
          }}
        >
          {isCorrect
            ? <svg width="18" height="18" fill="none"><path d="M3 9l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            : <svg width="18" height="18" fill="none"><path d="M14 4L4 14M4 4l10 10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg>
          }
        </div>
        <div>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: isCorrect ? "#4ade80" : "#f87171" }}>
            {isCorrect ? "Correct!" : "Not quite"}
          </div>
          {!isCorrect && (
            <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 2 }}>
              Correct answer: <strong style={{ color: "#86efac" }}>{question.correct_option}. {correctText}</strong>
            </div>
          )}
        </div>
      </div>

      {question.explanation && (
        <div
          style={{
            fontSize: "0.875rem", lineHeight: 1.7, color: "#cbd5e1",
            background: "rgba(0,0,0,0.25)", borderRadius: 10,
            padding: "0.75rem 1rem", marginBottom: "0.85rem",
            borderLeft: `3px solid ${isCorrect ? "#22c55e" : "#ef4444"}`,
          }}
        >
          {question.explanation}
        </div>
      )}

      <button
        type="button" onClick={onNext}
        style={{
          width: "100%", padding: "0.75rem 1rem", borderRadius: 12,
          border: "none", color: "#fff", fontSize: "0.9rem", fontWeight: 700,
          fontFamily: "Sora, sans-serif", cursor: "pointer",
          background: isCorrect ? "#16a34a" : "#2563eb",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.1)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.filter = ""; e.currentTarget.style.transform = ""; }}
      >
        {isLast ? "See My Results \u2192" : "Next Question \u2192"}
      </button>
    </div>
  );
}
