import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // Path from App.js to context is correct
import Register from './components/Register';
import Login from './components/Login';
import SobrietyTracker from './components/SobrietyTracker';
import ProtectedRoute from './components/ProtectedRoute';
import AdminPage from './components/AdminPage'; 
import AdminProtectedRoute from './components/AdminProtectedRoute'; 

function App() {
  return (
    <AuthProvider>
      <Router basename="/sobriety-tracker-v2">
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <SobrietyTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminPage />
              </AdminProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;