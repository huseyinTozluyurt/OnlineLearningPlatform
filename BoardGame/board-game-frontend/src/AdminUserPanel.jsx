// AdminUserPanel.jsx
import React, { useEffect, useState } from 'react';

function AdminUserPanel() {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('PLAYER');

  // Fetch existing users from backend
  useEffect(() => {
    fetch('http://localhost:8080/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error('Fetch users failed:', err));
  }, []);

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!username || !password) return;

    const newUser = { username, password, role };

    fetch('http://localhost:8080/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    })
      .then(res => res.json())
      .then(savedUser => {
        setUsers([...users, savedUser]);
        setUsername('');
        setPassword('');
        setRole('PLAYER');
      })
      .catch(err => console.error('Add user error:', err));
  };

  const handleDeleteUser = (id) => {
    fetch(`http://localhost:8080/api/users/${id}`, {
      method: 'DELETE'
    })
      .then(() => setUsers(users.filter(u => u.id !== id)))
      .catch(err => console.error('Delete error:', err));
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>👥 User Management</h2>

        <form onSubmit={handleAddUser} style={styles.form}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={styles.input}
          >
            <option value="PLAYER">Player</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button type="submit" style={styles.button}>➕ Add User</button>
        </form>

        <ul style={styles.list}>
          {users.map(user => (
            <li key={user.id} style={styles.listItem}>
              <strong>{user.username}</strong> ({user.role})
              <button onClick={() => handleDeleteUser(user.id)} style={styles.deleteButton}>❌</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh', background: '#f0f4f8', display: 'flex', justifyContent: 'center', alignItems: 'center'
  },
  card: {
    backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', width: '100%', maxWidth: '500px'
  },
  title: {
    fontSize: '1.8rem', color: '#1a237e', marginBottom: '20px', textAlign: 'center'
  },
  form: {
    display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px'
  },
  input: {
    padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem'
  },
  button: {
    padding: '10px', borderRadius: '8px', backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer'
  },
  list: {
    listStyle: 'none', padding: 0
  },
  listItem: {
    padding: '10px', border: '1px solid #ddd', marginBottom: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  deleteButton: {
    backgroundColor: '#e53935', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer'
  }
};

export default AdminUserPanel;
