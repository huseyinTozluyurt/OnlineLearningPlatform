// src/components/QuestionTextCard.jsx
import React from "react";

const API_BASE = "http://localhost:8080";

function QuestionTextCard({ questionText, questionId, hasImage }) {
  return (
    <div style={styles.card}>
      <h3>Question</h3>
      <p>{questionText}</p>

      {hasImage && questionId && (
        <img
          src={`${API_BASE}/api/questions/${questionId}/image`}
          alt="Question"
          style={styles.image}
        />
      )}
    </div>
  );
}

const styles = {
  card: {
    border: "2px solid #ccc",
    padding: "20px",
    borderRadius: "12px",
    width: "250px",
    backgroundColor: "#ffffff",
    textAlign: "center",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  },
  image: {
    maxWidth: "200px",
    maxHeight: "140px",
    width: "auto",
    height: "auto",
    objectFit: "contain",
    marginTop: "12px",
    borderRadius: "10px",
    border: "1px solid #ddd",
  },
};

export default QuestionTextCard;
