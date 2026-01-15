import React, { useEffect, useState } from "react";

function QuestionCard({
  playerId,
  playerName,
  onSubmitAnswer,
  isMyTurn = true,
  isFinished = false,          // ✅ NEW
  winnerUsername = null,       // ✅ NEW (optional display)
}) {
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isPrizeVisible, setIsPrizeVisible] = useState(false);

  // prevent rapid multi-submits in the same turn
  const [submitted, setSubmitted] = useState(false);

  // reset when turn changes OR when game finishes
  useEffect(() => {
    setUserAnswer("");
    setFeedback("");
    setIsPrizeVisible(false);
    setSubmitted(false);
  }, [playerId, isFinished]);

  const handleSubmit = async () => {
    if (isFinished) return;
    if (!isMyTurn) return;
    if (submitted) return;

    const answerText = userAnswer.trim();
    if (!answerText) {
      setFeedback("⚠ Please type an answer.");
      return;
    }

    if (!onSubmitAnswer) {
      console.warn("QuestionCard: onSubmitAnswer prop is missing.");
      return;
    }

    setSubmitted(true);
    setFeedback("⏳ Checking answer...");

    try {
      const result = await onSubmitAnswer(answerText);

      let isCorrect = false;
      if (typeof result === "boolean") {
        isCorrect = result;
      } else if (result && typeof result === "object") {
        if (typeof result.correct === "boolean") isCorrect = result.correct;
        else if (typeof result.isCorrect === "boolean") isCorrect = result.isCorrect;
      }

      setFeedback(isCorrect ? "✅ Correct!" : "❌ Wrong. Turn passed.");
      setIsPrizeVisible(isCorrect);
    } catch (err) {
      console.error("Answer submit failed:", err);
      setFeedback("❌ Failed to submit answer. Try again.");
      setSubmitted(false);
      setIsPrizeVisible(false);
    }
  };

  const isDisabled = isFinished || !isMyTurn || submitted;

  return (
    <div style={styles.card}>
      {/* ✅ Title */}
      <h2>
        {isFinished
          ? "🏁 Game Finished"
          : playerName
          ? `${playerName}'s Turn`
          : `Player ${playerId}'s Turn`}
      </h2>

      {/* ✅ Winner line (if finished) */}
      {isFinished && (
        <div style={styles.winnerLine}>
          🏆 Winner: <strong>{winnerUsername || "—"}</strong>
        </div>
      )}

      <h3>Your Answer</h3>

      <input
        style={styles.input}
        type="text"
        placeholder={
          isFinished
            ? "Game finished."
            : isMyTurn
            ? "Type your answer"
            : "Wait for your turn..."
        }
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        disabled={isDisabled}
      />

      <button
        style={{
          ...styles.button,
          backgroundColor: isDisabled ? "#888" : "#4caf50",
          cursor: isDisabled ? "not-allowed" : "pointer",
        }}
        onClick={handleSubmit}
        disabled={isDisabled}
      >
        Submit
      </button>

      <div style={styles.feedback}>
        {isFinished
          ? "✅ This match ended. You can go back to Rooms."
          : isMyTurn
          ? feedback
          : `⏳ Waiting for ${playerName || `Player ${playerId}`} to answer...`}
      </div>

      {/* keep your prize animation if you want */}
      {!isFinished && isPrizeVisible && (
        <div style={styles.prizeCard}>🎁 You unlocked a secret prize!</div>
      )}
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: "var(--card-bg, #111827)",
    padding: "20px",
    borderRadius: "var(--border-radius, 12px)",
    width: "300px",
    boxShadow: "var(--shadow, 0 10px 25px rgba(0,0,0,0.25))",
    textAlign: "center",
    color: "#f9fafb",
  },
  winnerLine: {
    marginTop: 8,
    marginBottom: 8,
    padding: "8px 10px",
    borderRadius: 10,
    background: "rgba(34,197,94,0.18)",
    border: "1px solid rgba(34,197,94,0.35)",
    fontWeight: 700,
  },
  prizeCard: {
    marginTop: "20px",
    padding: "15px",
    border: "2px solid var(--secondary, #facc15)",
    borderRadius: "var(--border-radius, 12px)",
    backgroundColor: "#fff3cd",
    fontWeight: "bold",
    color: "#8b4513",
  },
  input: {
    width: "80%",
    padding: "10px",
    margin: "10px 0",
    fontSize: "16px",
    borderRadius: "8px",
    border: "1px solid #9ca3af",
  },
  button: {
    padding: "10px 20px",
    fontSize: "16px",
    borderRadius: "6px",
    border: "none",
    color: "white",
    transition: "transform 0.1s ease",
  },
  feedback: {
    marginTop: "10px",
    fontWeight: "bold",
  },
};

export default QuestionCard;
