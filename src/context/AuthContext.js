import React, { useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = React.createContext();
const auth = supabase.auth;

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user || null;
      setCurrentUser(user);
      setIsAdmin(user && user.email === ADMIN_EMAIL);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user || null;
      setCurrentUser(user);
      setIsAdmin(user && user.email === ADMIN_EMAIL);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
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