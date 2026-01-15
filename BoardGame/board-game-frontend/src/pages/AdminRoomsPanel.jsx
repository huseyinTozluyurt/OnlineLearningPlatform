import React, { useEffect, useState } from "react";

const API_BASE = "http://localhost:8080";

function AdminRoomsPanel() {
  const [rooms, setRooms] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create-room form
  const [name, setName] = useState("");
  const [timeLimit, setTimeLimit] = useState(300);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);

  // Edit-room form
  const [editingRoom, setEditingRoom] = useState(null);
  const [editName, setEditName] = useState("");
  const [editTimeLimit, setEditTimeLimit] = useState(300);
  const [editQuestionIds, setEditQuestionIds] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [roomsRes, questionsRes] = await Promise.all([
        fetch(`${API_BASE}/api/games`),
        fetch(`${API_BASE}/api/questions`),
      ]);

      if (!roomsRes.ok) throw new Error("Failed to load rooms");
      if (!questionsRes.ok) throw new Error("Failed to load questions");

      const roomsData = await roomsRes.json();
      const questionsData = await questionsRes.json();

      setRooms(roomsData);
      setQuestions(questionsData);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error while loading admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // -------- CREATE ROOM ----------

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter a room name.");
      return;
    }
    if (selectedQuestionIds.length === 0) {
      alert("Please select at least one question.");
      return;
    }

    const payload = {
      name: name.trim(),
      timeLimitSeconds: Number(timeLimit),
      questionIds: selectedQuestionIds,
    };

    try {
      const res = await fetch(`${API_BASE}/api/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create room");
      }

      await loadData();
      setName("");
      setTimeLimit(300);
      setSelectedQuestionIds([]);
    } catch (err) {
      console.error(err);
      alert(err.message || "Error while creating room.");
    }
  };

  // -------- DELETE ROOM ----------

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/games/${roomId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to delete room");
      }

      setRooms((prev) => prev.filter((r) => r.id !== roomId));
    } catch (err) {
      console.error(err);
      alert(err.message || "Error while deleting room.");
    }
  };

  // -------- EDIT ROOM (open / cancel / save) ----------

  const startEditRoom = (room) => {
    setEditingRoom(room);
    setEditName(room.name || "");
    setEditTimeLimit(room.timeLimitSeconds || 300);

    // Try to pre-fill question IDs if backend sends them
    if (Array.isArray(room.questionIds)) {
      setEditQuestionIds(room.questionIds);
    } else if (Array.isArray(room.questions)) {
      setEditQuestionIds(room.questions.map((q) => q.id));
    } else {
      setEditQuestionIds([]);
    }
  };

  const cancelEdit = () => {
    setEditingRoom(null);
    setEditName("");
    setEditTimeLimit(300);
    setEditQuestionIds([]);
  };

  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    if (!editingRoom) return;

    if (!editName.trim()) {
      alert("Please enter a room name.");
      return;
    }
    if (editQuestionIds.length === 0) {
      alert("Please select at least one question.");
      return;
    }

    const payload = {
      name: editName.trim(),
      timeLimitSeconds: Number(editTimeLimit),
      questionIds: editQuestionIds,
    };

    try {
      const res = await fetch(`${API_BASE}/api/games/${editingRoom.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update room");
      }

      await loadData();
      cancelEdit();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error while updating room.");
    }
  };

  // helper for <select multiple>
  const handleQuestionSelectChange = (setter) => (event) => {
    const options = Array.from(event.target.options);
    const chosenIds = options
      .filter((opt) => opt.selected)
      .map((opt) => Number(opt.value));
    setter(chosenIds);
  };

  // -------- RENDER ----------

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>🪐 Manage Rooms</h1>

      {error && <p style={styles.error}>{error}</p>}

      {/* CREATE ROOM */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Create New Room</h2>
        <form onSubmit={handleCreateRoom} style={styles.formRow}>
          <div style={styles.formField}>
            <label style={styles.label}>Room name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.formField}>
            <label style={styles.label}>Time limit (seconds)</label>
            <input
              type="number"
              min="30"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={{ ...styles.formField, flex: 2 }}>
            <label style={styles.label}>Select questions</label>
            <select
              multiple
              value={selectedQuestionIds.map(String)}
              onChange={handleQuestionSelectChange(setSelectedQuestionIds)}
              style={styles.multiselect}
            >
              {questions.map((q) => (
                <option key={q.id} value={q.id}>
                  #{q.id} - {q.content?.slice(0, 60) || "Question"}
                </option>
              ))}
            </select>
            <small style={styles.helperText}>
              Hold Ctrl (Windows) / Cmd (Mac) to select multiple questions.
            </small>
          </div>

          <button type="submit" style={styles.primaryButton}>
            ➕ Create Room
          </button>
        </form>
      </section>

      {/* ROOMS TABLE */}
      {/* ROOMS TABLE */}
<section style={styles.section}>
  <h2 style={styles.sectionTitle}>Existing Rooms</h2>

  {loading ? (
    <p>Loading rooms...</p>
  ) : rooms.length === 0 ? (
    <p>No rooms created yet.</p>
  ) : (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>ID</th>
          <th style={styles.th}>Name</th>
          <th style={styles.th}>Status</th>
          <th style={styles.th}>Players</th>
          <th style={styles.th}>Time limit (s)</th>
          <th style={styles.th}>Questions</th>
          <th style={styles.th}>Actions</th>
        </tr>
      </thead>

      <tbody>
        {rooms.map((room, idx) => (
          <tr key={room.id} style={idx % 2 === 1 ? styles.trAlt : undefined}>
            <td style={styles.td}>{room.id}</td>
            <td style={styles.td}>{room.name}</td>
            <td style={styles.td}>{room.status}</td>
            <td style={styles.td}>{room.playerCount ?? 0}/4</td>
            <td style={styles.td}>{room.timeLimitSeconds ?? 0}</td>
            <td style={styles.td}>
              {room.questionCount ??
                (Array.isArray(room.questions) ? room.questions.length : "—")}
            </td>

            <td style={{ ...styles.td, ...styles.actionsCell }}>
              <button style={styles.smallButton} onClick={() => startEditRoom(room)}>
                ✏️ Edit
              </button>
              <button
                style={{ ...styles.smallButton, ...styles.deleteButton }}
                onClick={() => handleDeleteRoom(room.id)}
              >
                🗑 Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</section>


      {/* EDIT PANEL */}
      {editingRoom && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            Edit Room: {editingRoom.name} (ID {editingRoom.id})
          </h2>
          <form onSubmit={handleUpdateRoom} style={styles.formRow}>
            <div style={styles.formField}>
              <label style={styles.label}>Room name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.formField}>
              <label style={styles.label}>Time limit (seconds)</label>
              <input
                type="number"
                min="30"
                value={editTimeLimit}
                onChange={(e) => setEditTimeLimit(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={{ ...styles.formField, flex: 2 }}>
              <label style={styles.label}>Select questions</label>
              <select
                multiple
                value={editQuestionIds.map(String)}
                onChange={handleQuestionSelectChange(setEditQuestionIds)}
                style={styles.multiselect}
              >
                {questions.map((q) => (
                  <option key={q.id} value={q.id}>
                    #{q.id} - {q.content?.slice(0, 60) || "Question"}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" style={styles.primaryButton}>
              💾 Save changes
            </button>
            <button
              type="button"
              style={{ ...styles.primaryButton, backgroundColor: "#777" }}
              onClick={cancelEdit}
            >
              ✖ Cancel
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: "28px 18px",
    maxWidth: "1150px",
    margin: "0 auto",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    color: "#0f172a",
  },

  heading: {
    fontSize: "2.1rem",
    fontWeight: 900,
    letterSpacing: "-0.02em",
    marginBottom: "18px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#0f2a5f",
  },

  error: {
    color: "#b91c1c",
    backgroundColor: "#fee2e2",
    border: "1px solid #fecaca",
    padding: "10px 12px",
    borderRadius: "10px",
    marginBottom: "14px",
    fontWeight: 600,
  },

  section: {
    marginTop: "18px",
    padding: "16px",
    borderRadius: "14px",
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 26px rgba(2, 8, 23, 0.08)",
  },

  sectionTitle: {
    margin: "0 0 12px",
    fontSize: "1.15rem",
    fontWeight: 800,
    color: "#111827",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  formRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    alignItems: "flex-end",
  },

  formField: {
    display: "flex",
    flexDirection: "column",
    minWidth: "220px",
    flex: 1,
  },

  label: {
    marginBottom: "6px",
    fontWeight: 700,
    fontSize: "0.92rem",
    color: "#374151",
  },

  input: {
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    backgroundColor: "#fff",
    outline: "none",
    transition: "border-color 120ms ease, box-shadow 120ms ease",
  },

  multiselect: {
    minHeight: "150px",
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    backgroundColor: "#fff",
    outline: "none",
  },

  helperText: {
    marginTop: "6px",
    fontSize: "0.82rem",
    color: "#6b7280",
  },

  primaryButton: {
    padding: "10px 16px",
    borderRadius: "12px",
    border: "1px solid #1d4ed8",
    backgroundColor: "#2563eb",
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
    boxShadow: "0 10px 18px rgba(37, 99, 235, 0.20)",
    transition: "transform 120ms ease, box-shadow 120ms ease, background 120ms ease",
    whiteSpace: "nowrap",
  },

  secondaryButton: {
    padding: "10px 16px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    backgroundColor: "#f3f4f6",
    color: "#111827",
    cursor: "pointer",
    fontWeight: 800,
    transition: "transform 120ms ease",
    whiteSpace: "nowrap",
  },

  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    marginTop: "10px",
    overflow: "hidden",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
  },

  th: {
    textAlign: "left",
    fontSize: "0.85rem",
    letterSpacing: "0.02em",
    textTransform: "uppercase",
    color: "#374151",
    backgroundColor: "#f9fafb",
    padding: "12px 10px",
    borderBottom: "1px solid #e5e7eb",
    position: "sticky",
    top: 0,
    zIndex: 1,
  },

  td: {
    padding: "12px 10px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "0.95rem",
    color: "#0f172a",
    verticalAlign: "top",
  },

  trAlt: {
    backgroundColor: "#fcfcfd",
  },

  actionsCell: {
    whiteSpace: "nowrap",
  },

  smallButton: {
    padding: "8px 10px",
    marginRight: "8px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    backgroundColor: "#f3f4f6",
    color: "#111827",
    cursor: "pointer",
    fontWeight: 800,
    transition: "transform 120ms ease",
  },

  deleteButton: {
    backgroundColor: "#dc2626",
    border: "1px solid #b91c1c",
    color: "white",
  },
};


export default AdminRoomsPanel;
