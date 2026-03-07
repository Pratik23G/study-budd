import FeedbackPanel from "./FeedbackPanel";

export default function QuizView({
  questions, q, currentIndex, cardKey, pickedForCurrent, hasAnswered,
  isFirst, isLast, progressPct, shakeRef,
  selectAnswer, goNext, goBack,
}) {
  return (
    <>
      <div className="qz-prog-meta">
        <span>Question {currentIndex + 1} of {questions.length}</span>
        <span>{Math.round(progressPct)}%</span>
      </div>
      <div className="qz-prog-track">
        <div className="qz-prog-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="qz-card" key={`qcard-${currentIndex}-${cardKey}`}>
        <div className="qz-q-num">Q{currentIndex + 1} of {questions.length}</div>
        <p className="qz-q-text">{q.question}</p>

        <div className="qz-opts" ref={shakeRef}>
          {(q.options || []).map((opt) => {
            const isPicked = pickedForCurrent === opt.label;
            const isCorrect = opt.label === q.correct_option;
            let cls = "qz-opt";
            if (hasAnswered) {
              cls += " qz-locked";
              if (isCorrect)     cls += " qz-correct";
              else if (isPicked) cls += " qz-wrong";
              else               cls += " qz-dim";
            }
            return (
              <button key={opt.label} type="button" className={cls} onClick={() => selectAnswer(opt.label)}>
                <span className="qz-opt-ltr">{opt.label}</span>
                {opt.text}
              </button>
            );
          })}
        </div>

        {hasAnswered && (
          <FeedbackPanel
            key={`fb-${currentIndex}-${cardKey}`}
            question={q}
            pickedLabel={pickedForCurrent}
            onNext={goNext}
            isLast={isLast}
          />
        )}
      </div>

      {!hasAnswered && (
        <button type="button" className="qz-back-btn" disabled={isFirst} onClick={goBack}>
          &larr; Previous
        </button>
      )}
    </>
  );
}
