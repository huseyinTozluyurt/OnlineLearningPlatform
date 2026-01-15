// src/pages/SignIn.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8080';

function SignIn() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      alert('Please enter both username and password.');
      return;
    }

    try {
      if (mode === 'login') {
        // ---- LOGIN ----
        const response = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }), // plain password
        });

        if (!response.ok) {
          const msg = await response.text();
          throw new Error(msg || 'Login failed: Invalid username or password.');
        }

        const user = await response.json();

        // 🔐 store logged-in user info for later (id, username, role)
        localStorage.setItem('user', JSON.stringify(user));

        // 👇 route by role
        if (user.role === 'ADMIN') {
          navigate('/admin');
        } else {
          // players go to room selection, not directly to the game
          navigate('/rooms');
        }
      } else {
        // ---- REGISTER AS PLAYER ----
        const response = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            password, // plain; backend will hash/encode later when we add it
            role: 'PLAYER',
          }),
        });

        if (!response.ok) {
          const msg = await response.text();
          throw new Error(msg || 'Registration failed.');
        }

        alert('Registration successful! You can now sign in.');
        setMode('login');
        setPassword('');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'An error occurred. Please try again.');
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    setPassword('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>
          🎮 {mode === 'login' ? 'Sign In' : 'Register as User'}
        </h2>
        <form onSubmit={handleSubmit} style={styles.form}>
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

          <button style={styles.button} type="submit">
            {mode === 'login' ? 'Sign In' : 'Register'}
          </button>
        </form>

        <p style={{ marginTop: '16px', fontSize: '0.95rem' }}>
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button type="button" style={styles.linkButton} onClick={toggleMode}>
            {mode === 'login' ? 'Register as user' : 'Back to login'}
          </button>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    width: '200vh',
    background: 'linear-gradient(to right, #2196f3, #21cbf3)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
    width: '100%',
    maxWidth: '360px',
    textAlign: 'center',
  },
  title: {
    fontSize: '2rem',
    color: '#0d47a1',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  input: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '1rem',
  },
  button: {
    padding: '12px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#1976d2',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: 0,
    fontSize: '0.95rem',
  },
};

export default SignIn;
