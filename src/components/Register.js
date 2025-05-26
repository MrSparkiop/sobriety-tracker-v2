import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { auth } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/'); // Redirect to the dashboard after successful registration
    } catch (err) {
      setError('Failed to create an account. ' + err.message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-white">Register</h2>
        {error && <p className="p-3 bg-red-500 text-white rounded">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-bold text-gray-400 block">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-3 mt-1 text-gray-200 bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"/>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-400 block">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-3 mt-1 text-gray-200 bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"/>
          </div>
          <button disabled={loading} type="submit" className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 rounded-md text-white font-bold transition-colors">
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