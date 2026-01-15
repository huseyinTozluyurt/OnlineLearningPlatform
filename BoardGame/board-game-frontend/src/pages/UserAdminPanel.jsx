// src/pages/UserAdminPanel.jsx
import React, { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:8080';

function UserAdminPanel() {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('PLAYER');

  const fetchUsers = () => {
    fetch(`${API_BASE}/api/users`)
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error('Fetch error:', err));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    const newUser = { username, password, role };

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      if (!res.ok) {
        const msg = await res.text();
        alert(msg || 'Failed to add user');
        return;
      }

      // registration OK, reload list from DB
      fetchUsers();
      setUsername('');
      setPassword('');
      setRole('PLAYER');
    } catch (err) {
      console.error('Add error:', err);
      alert('Error while adding user');
    }
  };

  const handleDeleteUser = (id) => {
    fetch(`${API_BASE}/api/users/${id}`, { method: 'DELETE' })
      .then(() => setUsers((prev) => prev.filter((u) => u.id !== id)))
      .catch((err) => console.error('Delete error:', err));
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>👥 User Management</h2>

        <form style={styles.form} onSubmit={handleAddUser}>
          <input
            style={styles.input}
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <select
            style={styles.select}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="PLAYER">Player</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button type="submit" style={styles.button}>➕ Add User</button>
        </form>

        <h3 style={styles.listTitle}>📋 Registered Users</h3>
        <ul style={styles.list}>
          {users.map((u) => (
            <li key={u.id} style={styles.listItem}>
              <strong>{u.username}</strong> ({u.role})
              <button
                style={styles.deleteButton}
                onClick={() => handleDeleteUser(u.id)}
              >
                ❌
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    width: '200vh',
    background: 'linear-gradient(to right, #8e24aa, #5e35b1)',
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
    maxWidth: '700px',
  },
  title: {
    fontSize: '1.8rem',
    marginBottom: '20px',
    color: '#4a148c',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  input: {
    flex: '1 1 150px',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #ccc',
  },
  select: {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #ccc',
  },
  button: {
    padding: '10px 16px',
    backgroundColor: '#4a148c',
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
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #eee',
  },
  deleteButton: {
    backgroundColor: '#e53935',
    color: '#fff',
    border: 'none',
    padding: '6px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};

export default UserAdminPanel;
