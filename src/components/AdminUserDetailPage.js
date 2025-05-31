import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFirestore, doc, getDoc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions'; // For calling Cloud Functions
import { app } from '../firebaseConfig'; // Your Firebase app instance
import { useAuth } from '../context/AuthContext';

const db = getFirestore(app);
const functions = getFunctions(app); // Initialize Firebase Functions
const appId = 'default-sobriety-app'; // Ensure this matches your SobrietyTracker.js

export default function AdminUserDetailPage() {
    const { viewUserId } = useParams(); // Get the userId from the URL parameter
    const { isAdmin } = useAuth(); // Get admin status of the currently logged-in user

    const [userData, setUserData] = useState(null); // From top-level /users collection
    const [userSobrietyProfile, setUserSobrietyProfile] = useState(null);
    const [userJournalEntries, setUserJournalEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMessage, setActionMessage] = useState('');
    const [isProcessingAction, setIsProcessingAction] = useState(false); // For button loading state

    // Fetch all user-related data
    useEffect(() => {
        if (!viewUserId) {
            setError("No user ID provided in URL.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError('');
        setActionMessage('');
        let active = true; // To prevent state updates on unmounted component

        // Combined function to fetch all data for the user
        const fetchDataForUser = async () => {
            try {
                // 1. Fetch basic user data (e.g., email, isDisabledByAdmin flag)
                const userDocRef = doc(db, "users", viewUserId);
                const userDocSnap = await getDoc(userDocRef);
                if (active && userDocSnap.exists()) {
                    setUserData({ uid: userDocSnap.id, ...userDocSnap.data() });
                } else if (active) {
                    console.warn("User document not found in 'users' collection for UID:", viewUserId);
                    // Set a default structure if user doc doesn't exist in /users, but they exist in Auth
                    setUserData({ uid: viewUserId, email: "N/A (No /users doc)", isDisabledByAdmin: false });
                }

                // 2. Fetch user's sobriety profile
                const profileDocRef = doc(db, `artifacts/${appId}/users/${viewUserId}/sobrietyData/profile`);
                const profileDocSnap = await getDoc(profileDocRef);
                if (active && profileDocSnap.exists()) {
                    setUserSobrietyProfile(profileDocSnap.data());
                } else if (active) {
                    setUserSobrietyProfile(null); 
                }

                // 3. Fetch user's journal entries (using onSnapshot for potential real-time updates)
                // It's fine to keep this as onSnapshot, or convert to getDocs if real-time isn't critical here
                const journalCollectionRef = collection(db, `artifacts/${appId}/users/${viewUserId}/sobrietyData/profile/journalEntries`);
                const q = query(journalCollectionRef, orderBy("timestamp", "desc"));
                
                const unsubscribeJournal = onSnapshot(q, (querySnapshot) => {
                    if (!active) return;
                    const entries = [];
                    querySnapshot.forEach((doc) => {
                        entries.push({ id: doc.id, ...doc.data() });
                    });
                    setUserJournalEntries(entries);
                    // Consider all data loaded once journal (last async op in this chain) is done
                    setIsLoading(false); 
                }, (err) => {
                    if (!active) return;
                    console.error("Error fetching journal entries:", err);
                    setError(prev => prev + " Failed to load journal entries.");
                    setIsLoading(false);
                });

                // Return only the journal unsubscribe as it's the only active listener here
                return () => {
                    unsubscribeJournal();
                };

            } catch (err) {
                if (!active) return;
                console.error("Error fetching user details:", err);
                setError("Failed to load some user details. " + err.message);
                setIsLoading(false);
            }
        };

        const cleanupFunction = fetchDataForUser();

        return () => { 
            active = false; 
            if (typeof cleanupFunction === 'function') {
                cleanupFunction(); // Call the unsubscribe if it was returned
            }
        };
    }, [viewUserId]);

    // --- UPDATED: Admin Action Handler to call Cloud Function ---
    const handleToggleUserActivation = async (targetDisabledStatus) => { // true to disable, false to enable
        if (!userData) return;
        const action = targetDisabledStatus ? "disable" : "enable";
        if (!window.confirm(`Are you sure you want to ${action} this user's account? This will update their Firebase Authentication status.`)) {
            return;
        }
        
        setIsProcessingAction(true);
        setActionMessage('');
        setError('');

        try {
            const toggleActivationFunction = httpsCallable(functions, 'toggleUserActivation');
            const result = await toggleActivationFunction({ uid: userData.uid, disable: targetDisabledStatus });
            
            if (result.data.success) {
                setActionMessage(String(result.data.message)); // Ensure it's a string
                // The Cloud Function updated Firestore, so we need to re-fetch or update local state.
                // For simplicity, re-fetch the user document.
                const userDocRef = doc(db, "users", userData.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    setUserData({ uid: userDocSnap.id, ...userDocSnap.data() });
                }
            } else {
                setError(String(result.data.message) || `Failed to ${action} user.`);
            }
        } catch (err) {
            console.error(`Error calling toggleUserActivation for user ${userData.uid}:`, err);
            setError(`Failed to ${action} user: ${err.message}`);
        }
        setIsProcessingAction(false);
    };

    const handleSendPasswordReset = () => {
        if (!userData || !userData.email || userData.email === "N/A (No /users doc)") {
            setError("User email not available to send password reset.");
            return;
        }
        if (!window.confirm(`This will trigger a password reset email to ${userData.email} via Firebase Authentication. Continue?`)) {
            return;
        }
        setActionMessage('');
        setError('');
        setIsProcessingAction(true);

        // In a real app, this would call a Cloud Function that uses admin.auth().generatePasswordResetLink() or similar
        // For now, we just log and show a message
        console.log(`ADMIN ACTION: Would call Cloud Function to trigger password reset for ${userData.email}.`);
        setActionMessage(`Password reset email would be initiated for ${userData.email} (Simulated - requires Cloud Function for real action).`);
        setIsProcessingAction(false); // Reset after simulation
    };


    if (isLoading) {
        return <div className="min-h-screen bg-slate-900 text-white p-8 text-center">Loading user details...</div>;
    }
    // If critical userData isn't found after loading
    if (!userData && !isLoading) {
         return <div className="min-h-screen bg-slate-900 text-white p-8 text-center">User main data record not found for UID: {viewUserId}. Please ensure a document exists in the top-level 'users' collection.</div>;
    }
    // General error display if userData might exist but other things failed
    if (error && (!userData || !userSobrietyProfile)) { 
        return (
            <div className="min-h-screen bg-slate-900 text-white p-8">
                <Link to="/admin" className="text-sky-400 hover:text-sky-300 mb-4 inline-block">&larr; Back to Admin Panel</Link>
                <p className="text-center text-red-400">{error}</p>
            </div>
        );
    }

    const isUserCurrentlyDisabledByAdmin = userData?.isDisabledByAdmin === true;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
            <header className="mb-8 pb-4 border-b border-slate-700">
                <Link to="/admin" className="text-sky-400 hover:text-sky-300 mb-4 inline-block">&larr; Back to Admin Panel</Link>
                <h1 className="text-3xl font-bold text-sky-400">User Details: {userData?.email || viewUserId}</h1>
            </header>

            {error && <p className="p-3 my-4 bg-yellow-600/80 text-white rounded text-center text-sm">{error}</p>}
            {actionMessage && <p className="p-3 my-4 bg-green-600/80 text-white rounded text-center text-sm">{actionMessage}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
                    <h2 className="text-xl font-semibold text-green-400 mb-3">Sobriety Profile</h2>
                    {userSobrietyProfile ? (
                        <>
                            <p><strong className="text-slate-400">Sobriety Start Date:</strong> {userSobrietyProfile.startDate ? new Date(userSobrietyProfile.startDate).toLocaleDateString() : 'Not set'}</p>
                            <p><strong className="text-slate-400">Achieved Milestones (Days):</strong> {(userSobrietyProfile.achievedMilestones || []).join(', ') || 'None yet'}</p>
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
                     <p><strong className="text-slate-400">Account Status (Firestore Flag):</strong> 
                        <span className={isUserCurrentlyDisabledByAdmin ? "text-red-400 font-semibold" : "text-green-400 font-semibold"}>
                            {isUserCurrentlyDisabledByAdmin ? " Disabled by Admin" : " Enabled"}
                        </span>
                    </p>
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
                    <h2 className="text-xl font-semibold text-yellow-400 mb-4">Admin Actions</h2>
                    <div className="space-y-3 sm:space-y-0 sm:flex sm:space-x-3">
                        {isUserCurrentlyDisabledByAdmin ? (
                             <button 
                                onClick={() => handleToggleUserActivation(false)} // false to enable
                                disabled={isProcessingAction}
                                className="w-full sm:w-auto py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold transition-colors disabled:opacity-50"
                            >
                                {isProcessingAction ? 'Processing...' : 'Enable User Account'}
                            </button>
                        ) : (
                            <button 
                                onClick={() => handleToggleUserActivation(true)} // true to disable
                                disabled={isProcessingAction}
                                className="w-full sm:w-auto py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold transition-colors disabled:opacity-50"
                            >
                                {isProcessingAction ? 'Processing...' : 'Deactivate User Account'}
                            </button>
                        )}
                        <button 
                            onClick={handleSendPasswordReset}
                            disabled={isProcessingAction}
                            className="w-full sm:w-auto py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-md font-semibold transition-colors disabled:opacity-50"
                        >
                            Send Password Reset Email (Simulated)
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-4">
                        Note: Account activation/deactivation now calls a Cloud Function to update Firebase Auth. Password reset is still simulated.
                    </p>
                </div>
            )}
             <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; } 
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; } 
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; } 
            `}</style>
        </div>
    );
}