// src/routes/PlayerRoute.jsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getUser, isPlayer } from "../auth";

export default function PlayerRoute() {
  const location = useLocation();
  const user = getUser();

  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  // if admin tries to go player routes, keep them in admin
  if (!isPlayer()) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
