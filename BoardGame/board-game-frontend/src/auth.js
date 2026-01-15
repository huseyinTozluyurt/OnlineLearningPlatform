// src/auth.js

const USER_KEY = "user";
const ROOM_KEY = "currentRoomId";

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem(USER_KEY);
}

export function isLoggedIn() {
  return !!getUser();
}

export function isAdmin() {
  const u = getUser();
  return u?.role === "ADMIN";
}

export function isPlayer() {
  const u = getUser();
  return u?.role === "PLAYER";
}

export function logout() {
  // also clear room, so re-login is clean
  clearUser();
  localStorage.removeItem(ROOM_KEY);
}

export function getCurrentRoomId() {
  const v = localStorage.getItem(ROOM_KEY);
  return v ? Number(v) : null;
}

export function setCurrentRoomId(roomId) {
  localStorage.setItem(ROOM_KEY, String(roomId));
}

export function clearCurrentRoomId() {
  localStorage.removeItem(ROOM_KEY);
}
