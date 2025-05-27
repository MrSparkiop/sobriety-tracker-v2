import React, { useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../firebaseConfig'; // Make sure this path is correct

const AuthContext = React.createContext();
const auth = getAuth(app);

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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      // --- SET ADMIN STATUS ---
      if (user && user.email === ADMIN_EMAIL) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
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