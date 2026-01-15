import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8080';

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    fetch(`${API_BASE}/api/games/open`)
      .then((res) => res.json())
      .then((data) => {
        setRooms(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Fetch rooms error:', err);
        setLoading(false);
      });
  }, []);

  const handleJoin = (roomId) => {
    if (!user) {
      alert('You must be logged in');
      return;
    }

    fetch(`${API_BASE}/api/games/${roomId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || 'Failed to join room');
        }
        return res.json();
      })
      .then((data) => {
        console.log('Joined room:', data);
        // you can pass gameId as state or query param
        navigate('/game', { state: { gameId: roomId } });
      })
      .catch((err) => {
        console.error(err);
        alert(err.message);
      });
  };

  if (!user) return null;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>🛰 Choose a Room</h2>
        <p style={{ marginBottom: '16px' }}>
          Logged in as <strong>{user.username}</strong>
        </p>

        {loading ? (
          <p>Loading rooms...</p>
        ) : rooms.length === 0 ? (
          <p>No available rooms. Ask your teacher/admin to create one.</p>
        ) : (
          <div style={styles.list}>
            {rooms.map((room) => (
              <div key={room.id} style={styles.roomItem}>
                <div>
                  <h3 style={{ margin: '0 0 4px' }}>{room.name}</h3>
                  <p style={{ margin: 0 }}>
                    Players: {room.playerCount} / 4
                  </p>
                </div>
                <button
                  style={styles.joinButton}
                  onClick={() => handleJoin(room.id)}
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(to right, #1e88e5, #3949ab)',
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
    marginBottom: '16px',
    color: '#1a237e',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  roomItem: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  joinButton: {
    padding: '8px 14px',
    backgroundColor: '#1e88e5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};

export default Rooms;
