// src/App.jsx

import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-6">My Portfolio</h1>
      
      {/* Your normal app content would go here… */}
      
      {/* 🔥 Test Error Button 🔥 */}
      <button
        onClick={() => { throw new Error("This is your first error!"); }}
        className="mt-8 px-6 py-3 bg-red-500 text-white rounded hover:bg-red-600 transition"
      >
        Break the world
      </button>
    </div>
  );
}
