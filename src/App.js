// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Register from './components/Register';
import Login from './components/Login';
import SobrietyTracker from './components/SobrietyTracker';
import ProtectedRoute from './components/ProtectedRoute';
import AdminPage from './components/AdminPage';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import AdminUserDetailPage from './components/AdminUserDetailPage';

// Import the Sentry HOC for React Router v6
import { withSentryReactRouterV6Routing } from '@sentry/react';

// Create a Sentry-instrumented version of Routes
const SentryInstrumentedRoutes = withSentryReactRouterV6Routing(Routes);

function App() {
  return (
    <AuthProvider>
      <Router basename="/sobriety-tracker-v2">
        {/* Use the Sentry-instrumented Routes component */}
        <SentryInstrumentedRoutes>
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
          <Route
            path="/admin/user/:viewUserId"
            element={
              <AdminProtectedRoute>
                <AdminUserDetailPage />
              </AdminProtectedRoute>
            }
          />
          {/* <Route path="*" element={<NotFoundPage />} /> */}
        </SentryInstrumentedRoutes>
      </Router>
    </AuthProvider>
  );
}

export default App;