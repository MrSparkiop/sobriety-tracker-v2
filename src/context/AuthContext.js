import React, { useContext, useState, useEffect } from 'react';
import { api } from '../apiClient';

const AuthContext = React.createContext();
const auth = {
  async signUp({ email, password }) {
    await api.register(email, password);
  },
  async signIn({ email, password }) {
    await api.login(email, password);
  },
  async signOut() {
    await api.logout();
  },
};

// --- DEFINE YOUR ADMIN EMAIL HERE ---
const ADMIN_EMAIL = "blagoyhristov03@gmail.com"; // <--- REPLACE THIS WITH YOUR ACTUAL ADMIN EMAIL

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // New state for admin status

  useEffect(() => {
    api.currentUser()
      .then((user) => {
        setCurrentUser(user || null);
        setIsAdmin(user && user.email === ADMIN_EMAIL);
      })
      .catch(() => setCurrentUser(null))
      .finally(() => setLoading(false));
  }, []);

  const value = {
    currentUser,
    auth,
    isAdmin, // --- EXPOSE isAdmin IN CONTEXT ---
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
