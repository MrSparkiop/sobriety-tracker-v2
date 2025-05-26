// src/components/TimerCard.js
import React from 'react';

export default function TimerCard({ value, label, className }) {
    return (
        <div className={`text-center p-4 rounded-lg shadow-lg ${className}`}>
            <div className="text-4xl md:text-6xl font-bold font-mono tracking-tight">{String(value).padStart(2, '0')}</div>
            <div className="text-xs md:text-sm uppercase text-white/70 tracking-wider mt-1">{label}</div>
        </div>
    );
};