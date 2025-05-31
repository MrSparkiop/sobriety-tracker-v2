import React, { useState, useEffect, useCallback } from 'react';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    onSnapshot, 
    collection, 
    addDoc, 
    serverTimestamp, 
    deleteDoc, 
    updateDoc, 
    arrayUnion, 
    getDocs, 
    getDoc,
    query, 
    orderBy 
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { app } from '../firebaseConfig';
import MilestoneModal from './MilestoneModal';
import Modal from './Modal';
import TimerCard from './TimerCard';
import JournalEntryCard from './JournalEntryCard';
import MoodCheckin from './MoodCheckin';

const db = getFirestore(app);
const appId = 'default-sobriety-app';

export default function SobrietyTracker() {
  const { currentUser, auth } = useAuth(); 
  const [sobrietyStartDate, setSobrietyStartDate] = useState('');
  const [inputStartDate, setInputStartDate] = useState('');
  const [duration, setDuration] = useState({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [dbMilestones, setDbMilestones] = useState([]);
  const [achievedMilestonesDays, setAchievedMilestonesDays] = useState([]);
  const [milestoneToShow, setMilestoneToShow] = useState(null);
  const [journalEntries, setJournalEntries] = useState([]);
  const [newJournalEntry, setNewJournalEntry] = useState('');
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState(null);
  const [isStartDateModalOpen, setIsStartDateModalOpen] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [totalSoberDays, setTotalSoberDays] = useState(0);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [isLoadingCheckinStatus, setIsLoadingCheckinStatus] = useState(true);

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

  // Fetch Global Milestones
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

  // Fetch User Profile Data and Check Milestones
  useEffect(() => {
    if (!currentUser || dbMilestones.length === 0) { 
        setIsLoading(false);
        return;
    }
    
    setIsLoading(true); 
    const userDocRef = doc(db, `artifacts/${appId}/users/${currentUser.uid}/sobrietyData/profile`);
    
    const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const previouslyAchievedDays = data.achievedMilestones || [];
            setAchievedMilestonesDays(previouslyAchievedDays);

            if (data.startDate) {
                setSobrietyStartDate(data.startDate);
                setInputStartDate(data.startDate);
                const currentDuration = calculateDuration(data.startDate);
                setDuration(currentDuration);

                const currentTotalSoberDays = Math.max(0, Math.floor((new Date() - new Date(data.startDate)) / (1000 * 60 * 60 * 24)));
                setTotalSoberDays(currentTotalSoberDays);

                const unseenMilestones = dbMilestones.filter(m => 
                    currentTotalSoberDays >= m.days && 
                    !previouslyAchievedDays.includes(m.days) 
                );

                if (unseenMilestones.length > 0) {
                    const latestUnseenMilestone = unseenMilestones.sort((a, b) => b.days - a.days)[0];
                     if (!milestoneToShow || (milestoneToShow && milestoneToShow.days !== latestUnseenMilestone.days)) {
                         setMilestoneToShow(latestUnseenMilestone);
                    }
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

    // Journal Listener
    const journalCollectionRef = collection(db, `artifacts/${appId}/users/${currentUser.uid}/sobrietyData/profile/journalEntries`);
    const unsubscribeJournal = onSnapshot(journalCollectionRef, (querySnapshot) => {
        const entries = [];
        querySnapshot.forEach((doc) => {
            entries.push({ id: doc.id, ...doc.data() });
        });
        entries.sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0));
        setJournalEntries(entries);
    }, (err) => { console.error("Error fetching journal entries:", err); });

    return () => {
        unsubscribeProfile();
        unsubscribeJournal();
    };
  }, [currentUser, calculateDuration, dbMilestones, milestoneToShow]);

  // Check for today's mood check-in
  useEffect(() => {
    if (!currentUser) {
        setIsLoadingCheckinStatus(false);
        return;
    }
    const getTodayDateString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const checkTodaysCheckin = async () => {
        setIsLoadingCheckinStatus(true);
        const todayDateString = getTodayDateString();
        const checkinDocRef = doc(db, `artifacts/${appId}/users/${currentUser.uid}/moodCheckins`, todayDateString);
        try {
            const docSnap = await getDoc(checkinDocRef);
            setHasCheckedInToday(docSnap.exists());
        } catch (err) {
            console.error("Error checking for today's check-in:", err);
            setHasCheckedInToday(false); 
        }
        setIsLoadingCheckinStatus(false);
    };
    checkTodaysCheckin();
  }, [currentUser]); 

  const handleCloseMilestoneModal = async () => {
    if (!milestoneToShow || !currentUser) return;
    const userDocRef = doc(db, `artifacts/${appId}/users/${currentUser.uid}/sobrietyData/profile`);
    try {
        await updateDoc(userDocRef, {
            achievedMilestones: arrayUnion(milestoneToShow.days)
        });
        setMilestoneToShow(null);
    } catch (error) {
        console.error("Error updating milestones in Firestore:", error);
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
  
  const handleCheckinSaved = () => {
      setHasCheckedInToday(true);
  };
  
  // REMOVED: handleTestError function
  // const handleTestError = () => {
  //   console.log("Attempting to trigger Sentry error...");
  //   throw new Error("Sentry Test Error from Sobriety Tracker App - " + new Date().toISOString());
  // };

  const isPageLoading = isLoading || isLoadingCheckinStatus;

  if (isPageLoading && !error) {
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
  
  const displayableMilestones = dbMilestones.map(milestone => {
    const isAchieved = achievedMilestonesDays.includes(milestone.days);
    const daysToGo = milestone.days - totalSoberDays;
    return {
        ...milestone,
        isAchieved,
        daysToGo: isAchieved || daysToGo <= 0 ? 0 : daysToGo,
    };
  });

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

          {(!sobrietyStartDate && !isPageLoading) && (
              <div className="flex justify-center mb-8">
                  <button onClick={() => setIsStartDateModalOpen(true)} className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all text-lg">
                      ✨ Set Your Sobriety Start Date
                  </button>
              </div>
          )}

          {sobrietyStartDate && (
              <>
                  {/* Timer Display Section */}
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

                  {/* Mood Check-in Section */}
                  {sobrietyStartDate && !isLoadingCheckinStatus && !hasCheckedInToday && (
                      <div className="my-10"> 
                          <MoodCheckin userId={currentUser.uid} onCheckinSaved={handleCheckinSaved} />
                      </div>
                  )}
                  {sobrietyStartDate && !isLoadingCheckinStatus && hasCheckedInToday && (
                      <div className="my-10 p-6 bg-slate-700/50 backdrop-blur-sm rounded-xl shadow-xl border border-white/10 text-center">
                          <p className="text-lg text-green-400">😊 You've checked in for today. Great job!</p>
                      </div>
                  )}

                  {/* My Milestones Section */}
                  <div className="mt-10 p-6 bg-slate-800 rounded-xl shadow-2xl">
                      <h2 className="text-2xl font-semibold text-amber-400 mb-6">My Milestones</h2>
                      {displayableMilestones.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {displayableMilestones.map(ms => (
                                  <div key={ms.id || ms.days} className={`p-4 rounded-lg shadow-md transition-all ${ms.isAchieved ? 'bg-green-500/80 border-green-400' : 'bg-slate-700/60 border-slate-600'} border`}>
                                      <h3 className={`font-semibold text-lg ${ms.isAchieved ? 'text-white' : 'text-slate-300'}`}>{ms.title}</h3>
                                      {ms.isAchieved ? (
                                          <p className="text-xs text-white/80 flex items-center mt-1">
                                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 text-yellow-300"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                              Achieved!
                                          </p>
                                      ) : (
                                          <p className="text-xs text-slate-400 mt-1">
                                              {ms.daysToGo > 0 ? `${ms.daysToGo} day${ms.daysToGo > 1 ? 's' : ''} to go` : 'Coming soon!'}
                                          </p>
                                      )}
                                  </div>
                              ))}
                          </div>
                      ) : (
                          !isLoading && <p className="text-slate-400 text-center">Milestones are loading or none are defined yet.</p>
                      )}
                  </div>

                  {/* Journal Section */}
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

          {/* REMOVED: Temporary Sentry Test Error Button from JSX */}
          {/* <button 
            onClick={handleTestError}
            className="fixed bottom-4 right-4 z-[100] p-3 ..."
          >
            Trigger Sentry Test Error
          </button>
          */}

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