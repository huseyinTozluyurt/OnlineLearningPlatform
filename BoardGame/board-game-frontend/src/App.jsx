// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import SignIn from "./pages/SignIn";
import BoardGame from "./components/BoardGame";

import AdminDashboard from "./pages/AdminDashboard";
import AdminPanel from "./pages/AdminPanel";
import AdminUserPanel from "./pages/UserAdminPanel";
import AdminRoomsPanel from "./pages/AdminRoomsPanel";

import RoomsPage from "./pages/RoomsPage";

import ProtectedRoute from "./routes/ProtectedRoute";

// local helper (kept inside App.jsx for simplicity)
function getUserFromStorage() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function App() {
  // smart redirect for unknown routes
  const user = getUserFromStorage();

  const defaultRedirect = () => {
    if (!user) return <Navigate to="/" replace />;
    if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
    return <Navigate to="/rooms" replace />;
  };

  return (
    <Routes>
      {/* login */}
      <Route path="/" element={<SignIn />} />

      {/* PLAYER side (protected) */}
      <Route element={<ProtectedRoute allowedRoles={["PLAYER"]} />}>
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/game" element={<BoardGame />} />
      </Route>

      {/* ADMIN side (protected) */}
      <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/questions" element={<AdminPanel />} />
        <Route path="/admin/users" element={<AdminUserPanel />} />
        <Route path="/admin/rooms" element={<AdminRoomsPanel />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={defaultRedirect()} />
    </Routes>
  );
}

export default App;
