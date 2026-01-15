import React, { useEffect, useRef, useState } from "react";

const formatName8 = (name, fallback = "Player") => {
  const v = (name ?? "").toString().trim();
  const out = v.length > 0 ? v : fallback;
  return out.slice(0, 8);
};

function QuestionCardLeft({
  activePlayerId,
  activePlayerName, // ✅ NEW
  countdownSeconds = 10,
  onTimeUp,
  turnKey,
}) {
  const [timeLeft, setTimeLeft] = useState(countdownSeconds);

  // prevents onTimeUp from firing multiple times for same turn
  const firedRef = useRef(false);

  const displayName = formatName8(activePlayerName, `Player${activePlayerId}`);

  useEffect(() => {
    // Reset every new turn
    setTimeLeft(countdownSeconds);
    firedRef.current = false;
  }, [activePlayerId, countdownSeconds, turnKey]);

  useEffect(() => {
    // use <= 0 to prevent rare negative values (tab lag)
    if (timeLeft <= 0) {
      if (!firedRef.current) {
        firedRef.current = true;
        if (onTimeUp) onTimeUp();
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onTimeUp]);

  return (
    <div style={styles.card}>
      <h3>Current Turn</h3>
      <p>
        <strong>{displayName}</strong>
      </p>
      <p style={styles.timer}>⏳ Time Left: {timeLeft}s</p>
    </div>
  );
}

const styles = {
  card: {
    border: "2px solid #2196f3",
    padding: "20px",
    borderRadius: "12px",
    width: "250px",
    backgroundColor: "#e3f2fd",
    textAlign: "center",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
  },
  timer: {
    fontSize: "1.2rem",
    fontWeight: "bold",
    color: "#0d47a1",
    marginTop: "10px",
  },
};

export default QuestionCardLeft;
