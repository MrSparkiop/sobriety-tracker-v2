import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Register from './components/Register';
import Login from './components/Login';
import SobrietyTracker from './components/SobrietyTracker';
import ProtectedRoute from './components/ProtectedRoute';
import AdminPage from './components/AdminPage'; 
import AdminProtectedRoute from './components/AdminProtectedRoute'; 
import AdminUserDetailPage from './components/AdminUserDetailPage'; // <-- NEW IMPORT

function App() {
  return (
    <AuthProvider>
      <Router basename="/sobriety-tracker-v2"> {/* Ensure basename is correct if deploying to a subfolder */}
        <Routes>
          {/* Public Routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Protected User Route */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <SobrietyTracker />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/user/:viewUserId" // :viewUserId is a URL parameter
            element={
              <AdminProtectedRoute> {/* Ensures only admins can see this detailed page */}
                <AdminUserDetailPage />
              </AdminProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;