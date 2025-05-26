import React, { useState, useEffect, useCallback } from 'react';
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, serverTimestamp, deleteDoc, updateDoc, arrayUnion, getDocs, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { app } from '../firebaseConfig';
import MilestoneModal from './MilestoneModal';
import Modal from './Modal';
import TimerCard from './TimerCard';
import JournalEntryCard from './JournalEntryCard';

const db = getFirestore(app);

// Milestones are fetched from Firestore now, so the hardcoded array is removed.

const appId = 'default-sobriety-app';

export default function SobrietyTracker() {
  const { currentUser, auth } = useAuth(); 
  const [sobrietyStartDate, setSobrietyStartDate] = useState('');
  const [inputStartDate, setInputStartDate] = useState('');
  const [duration, setDuration] = useState({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  const [dbMilestones, setDbMilestones] = useState([]); // For milestones from Firestore
  
  const [achievedMilestones, setAchievedMilestones] = useState([]);
  const [milestoneToShow, setMilestoneToShow] = useState(null);
  const [journalEntries, setJournalEntries] = useState([]);
  const [newJournalEntry, setNewJournalEntry] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStartDateModalOpen, setIsStartDateModalOpen] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);

  const calculateDuration = useCallback((startDateString) => {
    const start = new Date(startDateString);
    const now = new Date();

    if (isNaN(start.getTime()) || start > now) {
      return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();
    let hours = now.getHours() - start.getHours();
    let minutes = now.getMinutes() - start.getMinutes();
    let seconds = now.getSeconds() - start.getSeconds();

    if (seconds < 0) { seconds += 60; minutes--; }
    if (minutes < 0) { minutes += 60; hours--; }
    if (hours < 0) { hours += 24; days--; }
    if (days < 0) {
      const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += lastMonth.getDate();
      months--;
    }
    if (months < 0) { months += 12; years--; }

    return { years, months, days, hours, minutes, seconds };
  }, []);

  useEffect(() => {
    if (!sobrietyStartDate) return;
    const interval = setInterval(() => {
      setDuration(calculateDuration(sobrietyStartDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [sobrietyStartDate, calculateDuration]);

  useEffect(() => {
    if (!currentUser) return; 

    const fetchMilestones = async () => {
      try {
        const milestonesCollectionRef = collection(db, "milestones");
        const q = query(milestonesCollectionRef, orderBy("days", "asc"));
        const querySnapshot = await getDocs(q);
        const milestonesData = [];
        querySnapshot.forEach((doc) => {
          milestonesData.push({ id: doc.id, ...doc.data() });
        });
        setDbMilestones(milestonesData);
      } catch (err) {
        console.error("Error fetching milestones:", err);
        setError("Failed to load milestones configuration.");
      }
    };

    fetchMilestones();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || dbMilestones.length === 0) {
        // Don't set isLoading to false here if dbMilestones are still loading.
        // We can let the profile listener handle the final isLoading = false.
        return; 
    }
    
    setIsLoading(true); 
    const userDocRef = doc(db, `artifacts/${appId}/users/${currentUser.uid}/sobrietyData/profile`);
    const journalCollectionRef = collection(db, `artifacts/${appId}/users/${currentUser.uid}/sobrietyData/profile/journalEntries`);

    const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const previouslyAchieved = data.achievedMilestones || [];
            setAchievedMilestones(previouslyAchieved);

            if (data.startDate) {
                setSobrietyStartDate(data.startDate);
                setInputStartDate(data.startDate);
                const currentDuration = calculateDuration(data.startDate);
                setDuration(currentDuration);

                const totalSoberDays = Math.floor((new Date() - new Date(data.startDate)) / (1000 * 60 * 60 * 24));
                const unseenMilestones = dbMilestones.filter(m => 
                    totalSoberDays >= m.days && 
                    !previouslyAchieved.includes(m.days) 
                );

                if (unseenMilestones.length > 0) {
                    const latestUnseenMilestone = unseenMilestones.sort((a, b) => b.days - a.days)[0];
                    setMilestoneToShow(latestUnseenMilestone);
                }

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
  }, [currentUser, calculateDuration, dbMilestones]);

  const handleCloseMilestoneModal = async () => {
    if (!milestoneToShow || !currentUser) return;

    const userDocRef = doc(db, `artifacts/${appId}/users/${currentUser.uid}/sobrietyData/profile`);
    try {
        await updateDoc(userDocRef, {
            achievedMilestones: arrayUnion(milestoneToShow.days)
        });
        setMilestoneToShow(null);
    } catch (error) {
        console.error("Error updating milestones:", error);
        setMilestoneToShow(null);
    }
  };

  const handleSetStartDate = async () => {
      if (!db || !currentUser || !inputStartDate) return;
      try {
          const userDocRef = doc(db, `artifacts/${appId}/users/${currentUser.uid}/sobrietyData/profile`);
          await setDoc(userDocRef, { startDate: inputStartDate, achievedMilestones: [] }, { merge: true });
          setIsStartDateModalOpen(false);
          setError(null);
          setMilestoneToShow(null); 
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
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };
  
  if (isLoading && dbMilestones.length === 0) { // Show loading if milestones aren't loaded yet
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
          <MilestoneModal milestone={milestoneToShow} onClose={handleCloseMilestoneModal} />

          <header className="flex justify-between items-center mb-8">
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-emerald-400 to-teal-500">
                  My Sobriety Journey
              </h1>
              <div className="text-right">
                {currentUser && <p className="text-sm text-slate-300">{currentUser.email}</p>}
                <button onClick={handleLogout} className="text-sm text-sky-400 hover:text-sky-300 transition-colors">
                  Log Out
                </button>
              </div>
          </header>

          {(!sobrietyStartDate && !isLoading) && ( // Keep !isLoading check for initial date set prompt
              <div className="flex justify-center">
                  <button onClick={() => setIsStartDateModalOpen(true)} className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all text-lg">
                      ✨ Set Your Sobriety Start Date
                  </button>
              </div>
          )}

          {sobrietyStartDate && (
              <>
                  <div className="mb-8 p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl border border-white/10">
                      <div className="flex justify-between items-center mb-6">
                          <h2 className="text-2xl font-semibold text-green-400">Time Sober</h2>
                          <button onClick={() => setIsStartDateModalOpen(true)} className="text-sm bg-slate-700 hover:bg-slate-600 text-green-300 py-2 px-4 rounded-md transition-colors">
                              Edit Start Date
                          </button>
                      </div>
                      
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4 text-white">
                        <TimerCard value={duration.years} label="Years" className="bg-green-600/70" />
                        <TimerCard value={duration.months} label="Months" className="bg-emerald-600/70" />
                        <TimerCard value={duration.days} label="Days" className="bg-teal-600/70" />
                        <TimerCard value={duration.hours} label="Hours" className="bg-cyan-600/70" />
                        <TimerCard value={duration.minutes} label="Minutes" className="bg-sky-600/70" />
                        <TimerCard value={duration.seconds} label="Seconds" className="bg-blue-600/70" />
                      </div>
                  </div>

                  <div className="mt-10 p-6 bg-slate-800 rounded-xl shadow-2xl">
                      <div className="flex justify-between items-center mb-6">
                          <h2 className="text-2xl font-semibold text-sky-400">My Journal</h2>
                          <button onClick={() => setIsJournalModalOpen(true)} className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:shadow-lg transition-all">
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
            
          <style jsx global>{`
              .custom-scrollbar::-webkit-scrollbar { width: 8px; }
              .custom-scrollbar::-webkit-scrollbar-track { background: #2d3748; }
              .custom-scrollbar::-webkit-scrollbar-thumb { background: #4a5568; border-radius: 10px; }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #718096; }
          `}</style>
      </div>
  );
}