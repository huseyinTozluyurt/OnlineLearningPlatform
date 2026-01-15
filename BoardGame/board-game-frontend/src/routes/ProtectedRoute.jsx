// src/routes/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

// small helper (kept local to avoid extra dependency)
function getUserFromStorage() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function defaultHomeForRole(user) {
  if (!user) return "/";
  if (user.role === "ADMIN") return "/admin";
  return "/rooms";
}

/**
 * ProtectedRoute
 * - blocks access if user is not logged in
 * - optionally blocks if user role is not in allowedRoles
 *
 * Usage:
 * <Route element={<ProtectedRoute allowedRoles={["PLAYER"]} />}> ... </Route>
 * <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}> ... </Route>
 */
export default function ProtectedRoute({ allowedRoles }) {
  const user = getUserFromStorage();

  // Not logged in
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Role check (if provided)
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      // logged in but wrong role -> send them to their correct home
      return <Navigate to={defaultHomeForRole(user)} replace />;
    }
  }

  return <Outlet />;
}
