import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8080";

function RoomsPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [currentRoomId, setCurrentRoomId] = useState(() => {
    const v = localStorage.getItem("currentRoomId");
    return v ? Number(v) : null;
  });

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE}/api/games/open`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to load rooms.");
      }
      const data = await res.json();
      setRooms(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error while loading rooms.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const handleJoin = async (roomId) => {
    if (!user) {
      alert("You need to log in first.");
      navigate("/");
      return;
    }
    setJoining(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/games/${roomId}/join?userId=${user.id}`,
        { method: "POST" }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to join room.");
      }

      setCurrentRoomId(roomId);
      localStorage.setItem("currentRoomId", String(roomId));

      await loadRooms();

      // After join go to game
      navigate("/game", { state: { gameId: roomId } });
    } catch (err) {
      console.error(err);
      alert(err.message || "Error while joining room.");
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!user || !currentRoomId) return;
    if (!window.confirm("Leave current room?")) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/games/${currentRoomId}/leave?userId=${user.id}`,
        { method: "POST" }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to leave room.");
      }

      localStorage.removeItem("currentRoomId");
      setCurrentRoomId(null);
      await loadRooms();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error while leaving room.");
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>🚀 Choose a Room</h1>

      {error && <p style={styles.error}>{error}</p>}

      {currentRoomId && (
        <div style={styles.currentRoomBox}>
          <span>
            You are currently in room <strong>#{currentRoomId}</strong>
          </span>
          <button style={styles.secondaryButton} onClick={handleLeave}>
            Leave room
          </button>
        </div>
      )}

      {loading ? (
        <p>Loading rooms...</p>
      ) : rooms.length === 0 ? (
        <p>No active rooms yet. Please wait for your teacher to create one.</p>
      ) : (
        <div style={styles.cardsGrid}>
          {rooms.map((room) => {
            const isFull = (room.playerCount ?? 0) >= 4;
            const isJoined = currentRoomId === room.id;

            return (
              <div key={room.id} style={styles.card}>
                <h3 style={{ marginBottom: "4px" }}>{room.name}</h3>
                <p style={styles.smallText}>
                  Players: {room.playerCount ?? 0}/4
                </p>
                <p style={styles.smallText}>
                  Time limit: {room.timeLimitSeconds ?? 0} seconds
                </p>
                <p style={styles.smallText}>
                  Questions:{" "}
                  {room.questionCount ??
                    (Array.isArray(room.questions)
                      ? room.questions.length
                      : "—")}
                </p>

                <button
                  style={{
                    ...styles.primaryButton,
                    opacity: isFull ? 0.5 : 1,
                    cursor: isFull ? "not-allowed" : "pointer",
                  }}
                  disabled={isFull || joining}
                  onClick={() => handleJoin(room.id)}
                >
                  {isJoined ? "Re-enter game" : isFull ? "Room full" : "Join"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: "24px",
    maxWidth: "960px",
    margin: "0 auto",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  heading: {
    fontSize: "2rem",
    marginBottom: "16px",
  },
  error: {
    color: "red",
    marginBottom: "8px",
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  card: {
    padding: "16px",
    borderRadius: "12px",
    backgroundColor: "#0f172a",
    color: "white",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.6)",
  },
  primaryButton: {
    marginTop: "10px",
    padding: "8px 14px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#22c55e",
    color: "black",
    fontWeight: "600",
  },
  smallText: {
    fontSize: "0.9rem",
    margin: "2px 0",
  },
  currentRoomBox: {
    marginBottom: "14px",
    padding: "10px 14px",
    borderRadius: "10px",
    backgroundColor: "#fbbf24",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  secondaryButton: {
    padding: "6px 10px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#ef4444",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default RoomsPage;
