import React from 'react';

// A simple confetti piece component
const ConfettiPiece = ({ style, className }) => (
  <div className={`absolute w-2 h-4 ${className}`} style={style}></div>
);

// The main modal component
export default function MilestoneModal({ milestone, onClose }) {
  if (!milestone) return null;

  // Generate random positions for confetti
  const confetti = Array.from({ length: 50 }).map((_, i) => {
    const colors = ['bg-yellow-400', 'bg-green-400', 'bg-blue-400', 'bg-red-400', 'bg-pink-400'];
    const style = {
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      transform: `rotate(${Math.random() * 360}deg)`,
      animation: `fall 2s ease-out ${Math.random() * 2}s forwards`,
      opacity: 0,
    };
    return <ConfettiPiece key={i} style={style} className={colors[i % colors.length]} />;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <style>
        {`
          @keyframes fall {
            0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.8); }
            to { opacity: 1; transform: scale(1); }
          }
        `}
      </style>
      <div className="relative overflow-hidden bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md text-center border-2 border-yellow-400 transform transition-all" style={{ animation: 'fadeIn 0.5s ease-out' }}>
        {confetti}
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-yellow-300 uppercase tracking-widest">Congratulations!</h2>
          <p className="text-4xl md:text-5xl font-bold text-white my-4">{milestone.title}</p>
          <p className="text-lg text-slate-300">You've reached an incredible milestone. Keep up the amazing work!</p>
          <button
            onClick={() => {
              console.log("MilestoneModal: 'Continue' button clicked. Calling onClose prop."); // Debugging log
              onClose(); // This calls handleCloseMilestoneModal from SobrietyTracker
            }}
            className="mt-8 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}