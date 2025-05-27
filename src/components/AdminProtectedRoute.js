import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Corrected path

export default function AdminProtectedRoute({ children }) {
  const { currentUser, isAdmin } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />; // Not logged in, go to login
  }

  if (!isAdmin) {
    return <Navigate to="/" />; // Logged in, but not admin, go to dashboard
  }

  return children; // Logged in AND is admin, show the admin page
}