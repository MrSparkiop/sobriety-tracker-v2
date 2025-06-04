import React, { useState } from 'react';
import { api } from '../apiClient';

const MOOD_OPTIONS = [
  { name: 'Great', emoji: '😄', color: 'bg-green-500 hover:bg-green-600', value: 'great' },
  { name: 'Good', emoji: '😊', color: 'bg-sky-500 hover:bg-sky-600', value: 'good' },
  { name: 'Okay', emoji: '🙂', color: 'bg-yellow-500 hover:bg-yellow-600', value: 'okay' },
  { name: 'Anxious', emoji: '😟', color: 'bg-orange-500 hover:bg-orange-600', value: 'anxious' },
  { name: 'Struggling', emoji: '😥', color: 'bg-red-500 hover:bg-red-600', value: 'struggling' },
  { name: 'Tempted', emoji: '😬', color: 'bg-purple-500 hover:bg-purple-600', value: 'tempted' },
];

export default function MoodCheckin({ userId, onCheckinSaved }) {
  const [selectedMood, setSelectedMood] = useState(null); // Stores the 'value' of the mood
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleMoodSelect = (moodValue) => {
    setSelectedMood(moodValue);
  };

  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMood) {
      setError('Please select a mood.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    const todayDateString = getTodayDateString();
    try {
      await api.saveMoodCheckin(userId, {
          date_string: todayDateString,
          mood: selectedMood,
          note: note.trim(),
          timestamp: new Date(),
      });
      onCheckinSaved(); // Notify parent that check-in was saved
      setSelectedMood(null);
      setNote('');
    } catch (err) {
      console.error("Error saving mood check-in:", err);
      setError('Failed to save your check-in. Please try again.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="p-6 bg-slate-700/50 backdrop-blur-sm rounded-xl shadow-xl border border-white/10">
      <h3 className="text-xl font-semibold text-sky-300 mb-4">Daily Check-in: How are you feeling today?</h3>
      {error && <p className="p-2 mb-3 bg-red-500 text-white rounded text-sm">{error}</p>}
      
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {MOOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleMoodSelect(opt.value)}
            title={opt.name}
            className={`p-3 rounded-lg text-3xl transition-all duration-150 ease-in-out
                        ${selectedMood === opt.value ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-700 scale-110' : 'opacity-70 hover:opacity-100'} 
                        ${opt.color}`}
          >
            {opt.emoji}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note about your day (optional)"
          rows="3"
          className="w-full p-3 mb-4 text-gray-200 bg-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-500 custom-scrollbar"
        ></textarea>
        <button 
          type="submit" 
          disabled={!selectedMood || isSubmitting}
          className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 rounded-md text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save Check-in'}
        </button>
      </form>
    </div>
  );
}