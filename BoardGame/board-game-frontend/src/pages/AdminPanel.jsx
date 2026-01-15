// src/pages/AdminPanel.jsx
import React, { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:8080';

function AdminPanel() {
  const [questions, setQuestions] = useState([]);
  const [content, setContent] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [level, setLevel] = useState(1);
  const [editingId, setEditingId] = useState(null);

  // NEW: track selected file per questionId
  const [selectedFiles, setSelectedFiles] = useState({}); // { [questionId]: File }

  // === FETCH ALL QUESTIONS ===
  const fetchQuestions = () => {
    fetch(`${API_BASE}/api/questions`)
      .then((res) => res.json())
      .then((data) => setQuestions(data))
      .catch((err) => console.error('Fetch questions error:', err));
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // === RESET FORM ===
  const resetForm = () => {
    setContent('');
    setCorrectAnswer('');
    setLevel(1);
    setEditingId(null);
  };

  // === SUBMIT (CREATE or UPDATE) ===
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!content.trim() || !correctAnswer.trim()) {
      alert('Please fill question and correct answer.');
      return;
    }

    const payload = {
      content,
      correctAnswer,
      level: Number(level) || 1,
    };

    const url = editingId
      ? `${API_BASE}/api/questions/${editingId}`
      : `${API_BASE}/api/questions`;
    const method = editingId ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((t) => {
            throw new Error(t || 'Failed to save question');
          });
        }
        return res.json();
      })
      .then(() => {
        fetchQuestions();
        resetForm();
      })
      .catch((err) => {
        console.error('Save question error:', err);
        alert(err.message || 'Error while saving question');
      });
  };

  // === START EDITING A QUESTION ===
  const handleEdit = (q) => {
    setEditingId(q.id);
    setContent(q.content || '');
    setCorrectAnswer(q.correctAnswer || '');
    setLevel(q.level ?? 1);
  };

  // === DELETE QUESTION ===
  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    fetch(`${API_BASE}/api/questions/${id}`, { method: 'DELETE' })
      .then((res) => {
        if (!res.ok && res.status !== 204) {
          throw new Error('Failed to delete question');
        }
        setQuestions((prev) => prev.filter((q) => q.id !== id));
      })
      .catch((err) => {
        console.error('Delete question error:', err);
        alert(err.message || 'Error while deleting question');
      });
  };

  // ==========================
  // NEW: Image upload handlers
  // ==========================

  const handlePickFile = (questionId, file) => {
    setSelectedFiles((prev) => ({ ...prev, [questionId]: file }));
  };

  const uploadQuestionImage = async (questionId) => {
    const file = selectedFiles[questionId];
    if (!file) {
      alert('Please select an image file first.');
      return;
    }

    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/api/questions/${questionId}/image`, {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Upload failed');
      }

      // clear selected file for that question
      setSelectedFiles((prev) => {
        const copy = { ...prev };
        delete copy[questionId];
        return copy;
      });

      // refresh list (so preview updates)
      fetchQuestions();
      alert('Image uploaded successfully');
    } catch (err) {
      console.error('Upload image error:', err);
      alert(err.message || 'Error while uploading image');
    }
  };

  const deleteQuestionImage = async (questionId) => {
    if (!window.confirm('Remove image from this question?')) return;

    try {
      const res = await fetch(`${API_BASE}/api/questions/${questionId}/image`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Failed to remove image');
      }

      fetchQuestions();
      alert('Image removed');
    } catch (err) {
      console.error('Delete image error:', err);
      alert(err.message || 'Error while removing image');
    }
  };

  // cache-buster for image preview refresh
  const imageSrc = (questionId) =>
    `${API_BASE}/api/questions/${questionId}/image?ts=${Date.now()}`;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>🧠 Question Management</h2>

        {/* FORM: CREATE / EDIT */}
        <form style={styles.form} onSubmit={handleSubmit}>
          <textarea
            style={styles.textarea}
            placeholder="Question text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <input
            style={styles.input}
            type="text"
            placeholder="Correct answer"
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
          />
          <input
            style={styles.input}
            type="number"
            min="1"
            placeholder="Level (e.g. 1, 2, 3)"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          />

          <div style={styles.formButtons}>
            <button style={styles.saveButton} type="submit">
              {editingId ? '💾 Save Changes' : '➕ Add Question'}
            </button>
            {editingId && (
              <button
                type="button"
                style={styles.cancelButton}
                onClick={resetForm}
              >
                ✖ Cancel
              </button>
            )}
          </div>
        </form>

        {/* LIST OF QUESTIONS */}
        <h3 style={styles.listTitle}>📋 Existing Questions</h3>
        <div style={styles.list}>
          {questions.map((q) => (
            <div key={q.id} style={styles.listItem}>
              <div style={styles.questionInfo}>
                <div style={styles.questionContent}>
                  <strong>Q{q.id} (Level {q.level ?? 1})</strong>
                  <p>{q.content}</p>
                  <p style={styles.answer}>
                    Correct answer: <strong>{q.correctAnswer}</strong>
                  </p>

                  {/* ✅ NEW: image preview + upload */}
                  <div style={styles.imageBlock}>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Question Image</div>

                    {/* Preview: show img; if not found, hide via onError */}
                    <img
                      src={imageSrc(q.id)}
                      alt="Question"
                      style={styles.previewImg}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                      onLoad={(e) => {
                        e.currentTarget.style.display = 'block';
                      }}
                    />

                    <div style={styles.uploadRow}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePickFile(q.id, e.target.files?.[0] || null)}
                      />
                      <button
                        type="button"
                        style={styles.uploadButton}
                        onClick={() => uploadQuestionImage(q.id)}
                      >
                        ⬆ Upload
                      </button>
                      <button
                        type="button"
                        style={styles.removeImgButton}
                        onClick={() => deleteQuestionImage(q.id)}
                      >
                        🧹 Remove
                      </button>
                    </div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
                      Tip: upload PNG/JPG. If no image exists, preview stays hidden.
                    </div>
                  </div>
                </div>
              </div>

              <div style={styles.actions}>
                <button style={styles.editButton} onClick={() => handleEdit(q)}>
                  ✏ Edit
                </button>
                <button style={styles.deleteButton} onClick={() => handleDelete(q.id)}>
                  🗑 Delete
                </button>
              </div>
            </div>
          ))}

          {questions.length === 0 && (
            <p style={{ marginTop: '10px' }}>No questions found yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    width: '210vh',
    background: 'linear-gradient(to right, #ff9800, #f44336)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
  },
  card: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    width: '100%',
    maxWidth: '900px',
  },
  title: {
    fontSize: '1.8rem',
    marginBottom: '20px',
    color: '#e65100',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '20px',
  },
  textarea: {
    minHeight: '80px',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    resize: 'vertical',
  },
  input: {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #ccc',
  },
  formButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  },
  saveButton: {
    padding: '10px 16px',
    backgroundColor: '#e65100',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '10px 16px',
    backgroundColor: '#9e9e9e',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  listTitle: {
    fontSize: '1.4rem',
    marginBottom: '10px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    border: '1px solid #eee',
    borderRadius: '10px',
    padding: '10px 12px',
    backgroundColor: '#fafafa',
  },
  questionInfo: {
    flex: 1,
    marginRight: '10px',
  },
  questionContent: {
    marginBottom: '5px',
  },
  answer: {
    marginTop: '4px',
    color: '#444',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  editButton: {
    padding: '6px 10px',
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  deleteButton: {
    padding: '6px 10px',
    backgroundColor: '#e53935',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },

  // NEW styles
  imageBlock: {
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    border: '1px dashed #ccc',
    background: '#fff',
  },
  previewImg: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 10,
    marginBottom: 10,
    display: 'none',
    border: '1px solid #eee',
  },
  uploadRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  uploadButton: {
    padding: '8px 12px',
    backgroundColor: '#2e7d32',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
  removeImgButton: {
    padding: '8px 12px',
    backgroundColor: '#6d4c41',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
};

export default AdminPanel;
