export default function QuizSetSwitcher({ quizSets, activeSetId, setActiveSetId, onDelete }) {
  if (!quizSets.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
      {quizSets.map((s) => (
        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            className={`qz-set-pill ${s.id === activeSetId ? "active" : ""}`}
            onClick={() => setActiveSetId(s.id)}
          >
            {s.title} ({s.question_count})
          </button>
          {s.id === activeSetId && onDelete && (
            <button
              onClick={() => onDelete(s.id)}
              style={{ fontSize: "0.7rem", color: "#f87171", cursor: "pointer", background: "none", border: "none", fontWeight: 700, padding: "2px 4px" }}
              title="Delete set"
            >
              x
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
