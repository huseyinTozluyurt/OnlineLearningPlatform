// src/pages/AdminDashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { getUser, logout } from "../auth";

function AdminDashboard() {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <h2 style={styles.title}>⚙️ Admin Dashboard</h2>
          <button style={styles.logoutButton} onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>

        <p style={styles.subText}>
          Logged in as <strong>{user?.username || "Admin"}</strong>
        </p>

        <div style={styles.buttonGroup}>
          <button style={styles.button} onClick={() => navigate("/admin/questions")}>
            ➕ Manage Questions
          </button>
          <button style={styles.button} onClick={() => navigate("/admin/users")}>
            👥 Manage Users
          </button>
          <button style={styles.button} onClick={() => navigate("/admin/rooms")}>
            🧩 Manage Rooms
          </button>
        </div>

        <div style={{ marginTop: 18 }}>
          <button style={styles.secondaryButton} onClick={() => navigate("/rooms")}>
            👀 View Player Rooms Page
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    width: "200vh",
    background: "linear-gradient(to right, #0f2027, #203a43, #2c5364)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  },
  card: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "16px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
    textAlign: "center",
    width: "100%",
    maxWidth: "520px",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "10px",
  },
  title: {
    fontSize: "2rem",
    color: "#1a237e",
    margin: 0,
  },
  subText: {
    marginTop: "6px",
    marginBottom: "22px",
    color: "#374151",
  },
  buttonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  button: {
    padding: "15px 30px",
    fontSize: "1.1rem",
    backgroundColor: "#1976d2",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "12px 18px",
    fontSize: "1rem",
    backgroundColor: "#e5e7eb",
    color: "#111827",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
  },
  logoutButton: {
    padding: "10px 14px",
    fontSize: "0.95rem",
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
};

export default AdminDashboard;
