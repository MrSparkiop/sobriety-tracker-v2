import React, { useState, useEffect } from 'react'; // Removed useCallback as it's not used here
import { useParams, Link } from 'react-router-dom';
import { getFirestore, doc, getDoc, onSnapshot, collection, query, orderBy } from 'firebase/firestore'; // query and orderBy for journal
import { app } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';

const db = getFirestore(app);
const appId = 'default-sobriety-app'; // Ensure this matches your SobrietyTracker.js

export default function AdminUserDetailPage() {
    const { viewUserId } = useParams(); // Get the userId from the URL parameter
    const { isAdmin } = useAuth(); // Get admin status to potentially show/hide admin actions

    const [userData, setUserData] = useState(null); // From top-level /users collection
    const [userSobrietyProfile, setUserSobrietyProfile] = useState(null); // From /users/{uid}/sobrietyData/profile
    const [userJournalEntries, setUserJournalEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch all user-related data
    useEffect(() => {
        if (!viewUserId) {
            setError("No user ID provided in URL.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError('');
        let active = true; // To prevent state updates on unmounted component

        const fetchData = async () => {
            try {
                // 1. Fetch basic user data (e.g., email)
                const userDocRef = doc(db, "users", viewUserId);
                const userDocSnap = await getDoc(userDocRef);
                if (active && userDocSnap.exists()) {
                    setUserData({ uid: userDocSnap.id, ...userDocSnap.data() });
                } else if (active) {
                    // Not necessarily an error, user might not have a doc in /users
                    console.warn("User document not found in top-level 'users' collection for UID:", viewUserId);
                    setUserData({ uid: viewUserId, email: "Email not found in /users" }); // Provide UID at least
                }

                // 2. Fetch user's sobriety profile
                const profileDocRef = doc(db, `artifacts/${appId}/users/${viewUserId}/sobrietyData/profile`);
                const profileDocSnap = await getDoc(profileDocRef);
                if (active && profileDocSnap.exists()) {
                    setUserSobrietyProfile(profileDocSnap.data());
                } else if (active) {
                    setUserSobrietyProfile(null); // No profile set up by user
                }

                // 3. Fetch user's journal entries (using onSnapshot for real-time if preferred, or getDocs for one-time)
                const journalCollectionRef = collection(db, `artifacts/${appId}/users/${viewUserId}/sobrietyData/profile/journalEntries`);
                const q = query(journalCollectionRef, orderBy("timestamp", "desc"));
                
                // Using onSnapshot for journal entries to show any real-time additions by the user elsewhere
                const unsubscribeJournal = onSnapshot(q, (querySnapshot) => {
                    if (!active) return;
                    const entries = [];
                    querySnapshot.forEach((doc) => {
                        entries.push({ id: doc.id, ...doc.data() });
                    });
                    setUserJournalEntries(entries);
                    setIsLoading(false); // Set loading to false after all data is fetched or attempted
                }, (err) => {
                    if (!active) return;
                    console.error("Error fetching journal entries:", err);
                    setError(prev => prev + " Failed to load journal entries.");
                    setIsLoading(false);
                });

                return () => { // Cleanup for journal listener
                    unsubscribeJournal();
                };

            } catch (err) {
                if (!active) return;
                console.error("Error fetching user details:", err);
                setError("Failed to load some user details. " + err.message);
                setIsLoading(false);
            }
        };

        fetchData();

        return () => { active = false; }; // Cleanup to prevent setting state on unmounted component

    }, [viewUserId]);


    if (isLoading) {
        return <div className="min-h-screen bg-slate-900 text-white p-8 text-center">Loading user details...</div>;
    }
    if (error && !userData && !userSobrietyProfile) { // Show full error if nothing loaded
        return <div className="min-h-screen bg-slate-900 text-white p-8 text-center text-red-400">{error}</div>;
    }
    // If userData is essential and not found, you might want a stronger message
    if (!userData && !isLoading) {
         return <div className="min-h-screen bg-slate-900 text-white p-8 text-center">User basic data could not be loaded. UID: {viewUserId}</div>;
    }


    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
            <header className="mb-8 pb-4 border-b border-slate-700">
                <Link to="/admin" className="text-sky-400 hover:text-sky-300 mb-4 inline-block">&larr; Back to Admin Panel</Link>
                <h1 className="text-3xl font-bold text-sky-400">User Details: {userData?.email || viewUserId}</h1>
            </header>

            {/* Display any partial errors if some data loaded */}
            {error && <p className="p-3 mb-4 bg-yellow-600 text-white rounded text-center text-sm">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
                    <h2 className="text-xl font-semibold text-green-400 mb-3">Sobriety Profile</h2>
                    {userSobrietyProfile ? (
                        <>
                            <p><strong className="text-slate-400">Sobriety Start Date:</strong> {userSobrietyProfile.startDate ? new Date(userSobrietyProfile.startDate).toLocaleDateString() : 'Not set'}</p>
                            <p><strong className="text-slate-400">Achieved Milestones (Days):</strong> {(userSobrietyProfile.achievedMilestones || []).join(', ') || 'None yet'}</p>
                            {/* You can calculate and display current duration here if needed */}
                        </>
                    ) : (
                        <p className="text-slate-400">No sobriety profile data found (e.g., start date not set by user).</p>
                    )}
                </div>

                <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
                    <h2 className="text-xl font-semibold text-sky-400 mb-3">User Information</h2>
                    {userData && <p><strong className="text-slate-400">Email:</strong> {userData.email}</p>}
                    <p><strong className="text-slate-400">User ID (UID):</strong> {viewUserId}</p>
                    {userData?.createdAt?.toDate && <p><strong className="text-slate-400">Registered On (from /users):</strong> {userData.createdAt.toDate().toLocaleString()}</p>}
                </div>
            </div>

            <div className="mt-10 bg-slate-800 p-6 rounded-lg shadow-xl">
                <h2 className="text-xl font-semibold text-amber-400 mb-3">Journal Entries ({userJournalEntries.length})</h2>
                {userJournalEntries.length > 0 ? (
                    <ul className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                        {userJournalEntries.map(entry => (
                            <li key={entry.id} className="p-3 bg-slate-700 rounded-md border border-slate-600">
                                <p className="text-xs text-slate-400 mb-1">{entry.timestamp?.toDate ? entry.timestamp.toDate().toLocaleString() : 'Date missing'}</p>
                                <p className="text-slate-200 whitespace-pre-wrap">{entry.text}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-slate-400">No journal entries found for this user.</p>
                )}
            </div>

            {isAdmin && (
                <div className="mt-10 p-6 bg-slate-700/50 rounded-lg shadow-xl border border-yellow-500/50">
                    <h2 className="text-xl font-semibold text-yellow-400 mb-3">Admin Actions</h2>
                    <p className="text-slate-300 text-sm">
                        (Future: Add admin actions here, e.g., "Deactivate User in Auth", "Reset Password", etc. These would typically involve Cloud Functions.)
                    </p>
                </div>
            )}
             <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; } /* slate-800 */
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; } /* slate-700 */
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; } /* slate-600 */
            `}</style>
        </div>
    );
}