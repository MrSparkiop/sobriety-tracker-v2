import React, { useState, useEffect, useCallback } from 'react';
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext'; // Import the useAuth hook
import { app } from '../firebaseConfig'; // Import the initialized app

// Initialize Firestore instance once
const db = getFirestore(app);

// --- Helper Components (These are the same as before) ---
const Modal = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-md transform transition-all">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-slate-700">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-700 transition-colors p-1 rounded-full"
                        aria-label="Close modal"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

const StatCard = ({ label, value, bgColor = "bg-blue-500" }) => (
    <div className={`${bgColor} text-white p-6 rounded-xl shadow-lg text-center transition-transform hover:scale-105`}>
        <div className="text-4xl font-bold">{value}</div>
        <div className="text-sm uppercase tracking-wider mt-1">{label}</div>
    </div>
);

const JournalEntryCard = ({ entry, onDelete }) => (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4 border border-slate-200">
        <p className="text-xs text-slate-500 mb-1">
            {entry.timestamp?.toDate ? new Date(entry.timestamp.toDate()).toLocaleString() : 'Date pending...'}
        </p>
        <p className="text-slate-700 whitespace-pre-wrap">{entry.text}</p>
        {onDelete && (
             <button
                onClick={() => onDelete(entry.id)}
                className="mt-2 text-xs text-red-500 hover:text-red-700 transition-colors"
            >
                Delete Entry
            </button>
        )}
    </div>
);

// A default App ID for local development
const appId = 'default-sobriety-app';

export default function SobrietyTracker() {
  // Get the current logged-in user from our Auth Context
  const { currentUser, auth } = useAuth(); 

  // All UI-related state remains here
  const [sobrietyStartDate, setSobrietyStartDate] = useState('');
  const [inputStartDate, setInputStartDate] = useState('');
  const [daysSober, setDaysSober] = useState(0);
  const [weeksSober, setWeeksSober] = useState(0);
  const [monthsSober, setMonthsSober] = useState(0);
  const [yearsSober, setYearsSober] = useState(0);
  const [journalEntries, setJournalEntries] = useState([]);
  const [newJournalEntry, setNewJournalEntry] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStartDateModalOpen, setIsStartDateModalOpen] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);

  // --- Data Fetching and Calculations (This logic is mostly the same) ---
  const calculateSobrietyDuration = useCallback((startDateString) => {
      if (!startDateString) return;
      const start = new Date(startDateString);
      const now = new Date();
      if (isNaN(start.getTime())) return;

      const diffTime = Math.abs(now - start);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      setDaysSober(diffDays);
      setWeeksSober(Math.floor(diffDays / 7));
      
      let diffMonths = (now.getFullYear() - start.getFullYear()) * 12;
      diffMonths -= start.getMonth();
      diffMonths += now.getMonth();
      setMonthsSober(diffMonths <= 0 ? 0 : diffMonths);

      let diffYears = now.getFullYear() - start.getFullYear();
      if (now.getMonth() < start.getMonth() || (now.getMonth() === start.getMonth() && now.getDate() < start.getDate())) {
          diffYears--;
      }
      setYearsSober(diffYears < 0 ? 0 : diffYears);
  }, []);

  // --- Firestore Listener (UPDATED to use currentUser.uid) ---
  useEffect(() => {
    // If there's no logged-in user, do nothing.
    if (!currentUser) {
        setIsLoading(false);
        return;
    }
    
    setIsLoading(true);
    // Use the logged-in user's UID to create the path to their private data
    const userDocRef = doc(db, `artifacts/${appId}/users/${currentUser.uid}/sobrietyData/profile`);
    const journalCollectionRef = collection(db, `artifacts/${appId}/users/${currentUser.uid}/sobrietyData/profile/journalEntries`);

    const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.startDate) {
                setSobrietyStartDate(data.startDate);
                setInputStartDate(data.startDate);
                calculateSobrietyDuration(data.startDate);
            } else {
                setIsStartDateModalOpen(true);
            }
        } else {
            setSobrietyStartDate('');
            setIsStartDateModalOpen(true);
        }
        setIsLoading(false);
    }, (err) => {
        console.error("Error fetching profile:", err);
        setError("Failed to load sobriety data. " + err.message);
        setIsLoading(false);
    });

    const unsubscribeJournal = onSnapshot(journalCollectionRef, (querySnapshot) => {
        const entries = [];
        querySnapshot.forEach((doc) => {
            entries.push({ id: doc.id, ...doc.data() });
        });
        entries.sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0));
        setJournalEntries(entries);
    }, (err) => {
        console.error("Error fetching journal entries:", err);
    });

    return () => {
        unsubscribeProfile();
        unsubscribeJournal();
    };
  }, [currentUser, calculateSobrietyDuration]);


  // --- Event Handlers (UPDATED to use currentUser.uid) ---
  const handleSetStartDate = async () => {
      if (!db || !currentUser || !inputStartDate) return;
      try {
          const userDocRef = doc(db, `artifacts/${appId}/users/${currentUser.uid}/sobrietyData/profile`);
          await setDoc(userDocRef, { startDate: inputStartDate }, { merge: true });
          setIsStartDateModalOpen(false);
          setError(null);
      } catch (e) {
          console.error("Error saving start date:", e);
          setError("Failed to save start date. " + e.message);
      }
  };

  const handleAddJournalEntry = async () => {
      if (!db || !currentUser || !newJournalEntry.trim()) return;
      try {
          const journalCollectionRef = collection(db, `artifacts/${appId}/users/${currentUser.uid}/sobrietyData/profile/journalEntries`);
          await addDoc(journalCollectionRef, {
              text: newJournalEntry,
              timestamp: serverTimestamp()
          });
          setNewJournalEntry('');
          setIsJournalModalOpen(false);
          setError(null);
      } catch (e) {
          console.error("Error adding journal entry:", e);
          setError("Failed to add journal entry. " + e.message);
      }
  };

  const handleDeleteJournalEntry = async (entryId) => {
      if (!db || !currentUser || !entryId) return;
      if (window.confirm("Are you sure you want to delete this journal entry?")) {
          try {
              const entryDocRef = doc(db, `artifacts/${appId}/users/${currentUser.uid}/sobrietyData/profile/journalEntries`, entryId);
              await deleteDoc(entryDocRef);
          } catch (e) {
              console.error("Error deleting journal entry:", e);
              setError("Failed to delete journal entry. " + e.message);
          }
      }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      // The user will be automatically redirected to the login page by the ProtectedRoute
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  // --- Render Logic (This is the same as before) ---
  if (isLoading) {
      return (
          <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col justify-center items-center p-4 text-white">
              <div className="animate-pulse text-2xl font-semibold">Loading Your Journey...</div>
          </div>
      );
  }

  if (error) {
      return (
          <div className="min-h-screen bg-red-100 flex flex-col justify-center items-center p-4">
              <div className="bg-white p-8 rounded-lg shadow-xl text-center">
                  <h2 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong.</h2>
                  <p className="text-red-500">{error}</p>
              </div>
          </div>
      );
  }
  
  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 text-white p-4 sm:p-6 md:p-8">
          <header className="flex justify-between items-center mb-8">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-emerald-400 to-teal-500">
                  My Sobriety Journey
              </h1>
              <div className="text-right">
                <p className="text-sm text-slate-300">{currentUser.email}</p>
                <button onClick={handleLogout} className="text-sm text-sky-400 hover:text-sky-300 transition-colors">
                  Log Out
                </button>
              </div>
          </header>

          {!sobrietyStartDate && !isLoading && (
              <div className="flex justify-center">
                  <button
                      onClick={() => setIsStartDateModalOpen(true)}
                      className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all text-lg"
                  >
                      ✨ Set Your Sobriety Start Date
                  </button>
              </div>
          )}

          {sobrietyStartDate && (
              <>
                  <div className="mb-8 p-6 bg-slate-800 rounded-xl shadow-2xl">
                      <div className="flex justify-between items-center mb-4">
                          <h2 className="text-2xl font-semibold text-green-400">My Progress</h2>
                          <button
                              onClick={() => setIsStartDateModalOpen(true)}
                              className="text-sm bg-slate-700 hover:bg-slate-600 text-green-300 py-2 px-4 rounded-md transition-colors"
                          >
                              Edit Start Date
                          </button>
                      </div>
                      <p className="text-lg text-slate-300 mb-6">
                          Sober since: <span className="font-semibold text-green-400">{new Date(sobrietyStartDate).toLocaleDateString()}</span>
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <StatCard label="Days Sober" value={daysSober} bgColor="bg-green-600" />
                          <StatCard label="Weeks Sober" value={weeksSober} bgColor="bg-emerald-600" />
                          <StatCard label="Months Sober" value={monthsSober} bgColor="bg-teal-600" />
                          <StatCard label="Years Sober" value={yearsSober} bgColor="bg-cyan-600" />
                      </div>
                  </div>

                  <div className="mt-10 p-6 bg-slate-800 rounded-xl shadow-2xl">
                      <div className="flex justify-between items-center mb-6">
                          <h2 className="text-2xl font-semibold text-sky-400">My Journal</h2>
                          <button
                              onClick={() => setIsJournalModalOpen(true)}
                              className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:shadow-lg transition-all"
                          >
                              Add Entry ✍️
                          </button>
                      </div>
                      {journalEntries.length > 0 ? (
                          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                              {journalEntries.map(entry => (
                                  <JournalEntryCard key={entry.id} entry={entry} onDelete={handleDeleteJournalEntry} />
                              ))}
                          </div>
                      ) : (
                          <p className="text-slate-400 text-center py-6">No journal entries yet. Start by adding one!</p>
                      )}
                  </div>
              </>
          )}

          <Modal isOpen={isStartDateModalOpen} onClose={() => setIsStartDateModalOpen(false)} title="Set Sobriety Start Date">
                <div className="space-y-4">
                    <p className="text-slate-600">Select the date you started your sobriety journey.</p>
                    <input
                        type="date"
                        value={inputStartDate}
                        onChange={(e) => setInputStartDate(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-slate-700"
                    />
                    <button
                        onClick={handleSetStartDate}
                        disabled={!inputStartDate}
                        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg"
                    >
                        Save Start Date
                    </button>
                </div>
            </Modal>

            <Modal isOpen={isJournalModalOpen} onClose={() => setIsJournalModalOpen(false)} title="Add Journal Entry">
                 <div className="space-y-4">
                    <textarea
                        value={newJournalEntry}
                        onChange={(e) => setNewJournalEntry(e.target.value)}
                        placeholder="Write about your thoughts, feelings, or milestones..."
                        rows="5"
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-slate-700 custom-scrollbar"
                    />
                    <button
                        onClick={handleAddJournalEntry}
                        disabled={!newJournalEntry.trim()}
                        className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg"
                    >
                        Add to Journal
                    </button>
                </div>
            </Modal>
            
          {/* Custom Scrollbar CSS */}
          <style jsx global>{`
              .custom-scrollbar::-webkit-scrollbar {
                  width: 8px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                  background: #2d3748; /* Corresponds to bg-slate-800 */
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: #4a5568; /* Corresponds to bg-slate-600 */
                  border-radius: 10px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #718096; /* Corresponds to bg-slate-500 */
              }
          `}</style>
      </div>
  );
}