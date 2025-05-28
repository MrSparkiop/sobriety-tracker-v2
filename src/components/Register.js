import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
// --- NEW: Import Firestore functions and app instance ---
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '../firebaseConfig';

// --- NEW: Initialize Firestore ---
const db = getFirestore(app);

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Good practice to add confirm password
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { auth } = useAuth(); // useAuth provides the auth instance from AuthContext
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      setError('');
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // --- NEW: Add user to 'users' collection in Firestore ---
      if (user) {
        const userDocRef = doc(db, "users", user.uid); // Document ID will be the user's UID
        await setDoc(userDocRef, {
          email: user.email,
          createdAt: serverTimestamp(), // Stores the server's timestamp for when user was created
          // You could add other initial fields here, e.g., displayName: user.displayName (if available)
        });
        console.log("User document created in Firestore users collection for UID:", user.uid);
      }
      // --- End of new Firestore code ---

      navigate('/'); // Redirect to the dashboard after successful registration
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already in use.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError('Failed to create an account. Please try again.');
      }
      console.error("Registration error: ", err);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-white">Register</h2>
        {error && <p className="p-3 bg-red-500 text-white rounded text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-bold text-gray-400 block">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="w-full p-3 mt-1 text-gray-200 bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-400 block">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="At least 6 characters"
              className="w-full p-3 mt-1 text-gray-200 bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-400 block">Confirm Password</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
              className="w-full p-3 mt-1 text-gray-200 bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <button 
            disabled={loading} 
            type="submit" 
            className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 rounded-md text-white font-bold transition-colors disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <div className="text-center text-gray-400">
          Already have an account? <Link to="/login" className="font-bold text-sky-500 hover:underline">Log In</Link>
        </div>
      </div>
    </div>
  );
}