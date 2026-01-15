// src/routes/AdminRoute.jsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getUser, isAdmin } from "../auth";

export default function AdminRoute() {
  const location = useLocation();
  const user = getUser();

  // not logged in -> go login
  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  // logged in but not admin -> send to player side
  if (!isAdmin()) {
    return <Navigate to="/rooms" replace />;
  }

  // ok
  return <Outlet />;
}
