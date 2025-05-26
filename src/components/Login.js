import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { auth } = useAuth();
  const navigate = useNavigate();

  async function handleEmailSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      setError('Failed to log in. ' + err.message);
    }
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    try {
      setError('');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err) {
      setError('Failed to sign in with Google. ' + err.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-white">Log In</h2>
        {error && <p className="p-3 bg-red-500 text-white rounded">{error}</p>}
        <form onSubmit={handleEmailSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-bold text-gray-400 block">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-3 mt-1 text-gray-200 bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"/>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-400 block">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-3 mt-1 text-gray-200 bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"/>
          </div>
          <button disabled={loading} type="submit" className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 rounded-md text-white font-bold transition-colors">
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>
        <div className="my-4 flex items-center">
            <hr className="w-full border-gray-600"/>
            <span className="p-2 text-gray-400">OR</span>
            <hr className="w-full border-gray-600"/>
        </div>
        <button onClick={handleGoogleSignIn} className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 rounded-md text-white font-bold transition-colors flex items-center justify-center">
            {/* Simple Google Icon */}
            <svg className="w-6 h-6 mr-2" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
            Sign In with Google
        </button>
        <div className="text-center text-gray-400">
          Need an account? <Link to="/register" className="font-bold text-sky-500 hover:underline">Register</Link>
        </div>
      </div>
    </div>
  );
}