import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../apiClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { auth } = useAuth();
  const navigate = useNavigate();

  // This function handles the login error logic
  const handleLoginError = (err) => {
    setError('Failed to log in.');
    console.error('Login Error:', err);
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await api.login(email, password);
      navigate('/');
    } catch (err) {
      handleLoginError(err);
    }
    setLoading(false);
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-white">Log In</h2>
        {error && <p className="p-3 bg-red-500 text-white rounded text-center">{error}</p>}
        <form onSubmit={handleEmailSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-bold text-gray-400 block">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-3 mt-1 text-gray-200 bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"/>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-400 block">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-3 mt-1 text-gray-200 bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"/>
          </div>
          <button disabled={loading} type="submit" className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 rounded-md text-white font-bold transition-colors disabled:opacity-50">
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>
        <div className="text-center text-gray-400">
          Need an account? <Link to="/register" className="font-bold text-sky-500 hover:underline">Register</Link>
        </div>
      </div>
    </div>
  );
}