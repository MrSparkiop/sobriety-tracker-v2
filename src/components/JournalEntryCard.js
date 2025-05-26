// src/components/JournalEntryCard.js
import React from 'react';

export default function JournalEntryCard({ entry, onDelete }) {
    return (
        <div className="bg-white p-4 rounded-lg shadow-md mb-4 border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">
                {entry.timestamp?.toDate ? new Date(entry.timestamp.toDate()).toLocaleString() : 'Date pending...'}
            </p>
            <p className="text-slate-700 whitespace-pre-wrap">{entry.text}</p>
            {onDelete && (
                <button onClick={() => onDelete(entry.id)} className="mt-2 text-xs text-red-500 hover:text-red-700 transition-colors">
                    Delete Entry
                </button>
            )}
        </div>
    );
};