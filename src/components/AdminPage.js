import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; // 'Link' will now be used
import { useAuth } from '../context/AuthContext'; // 'auth' from useAuth will be used
// Import doc, deleteDoc, and updateDoc from Firestore
import { getFirestore, collection, addDoc, getDocs, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import Modal from './Modal'; // Assuming Modal.js is in the same components folder

const db = getFirestore(app);

export default function AdminPage() {
  const { auth } = useAuth(); // 'auth' is used in handleLogout

  const [milestones, setMilestones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [newMilestoneDays, setNewMilestoneDays] = useState('');
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const [editingMilestone, setEditingMilestone] = useState(null);
  const [editDays, setEditDays] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchMilestones = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const milestonesCollectionRef = collection(db, "milestones");
      const q = query(milestonesCollectionRef, orderBy("days", "asc"));
      const querySnapshot = await getDocs(q);
      const milestonesData = [];
      querySnapshot.forEach((doc) => {
        milestonesData.push({ id: doc.id, ...doc.data() });
      });
      setMilestones(milestonesData);
    } catch (err) {
      console.error("Error fetching milestones:", err);
      setError("Failed to load milestones. " + err.message);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const handleAddMilestone = async (e) => { // This function will now be used by the form
    e.preventDefault();
    if (!newMilestoneDays || !newMilestoneTitle.trim()) {
      setError("Both 'Days' and 'Title' are required for new milestone.");
      return;
    }
    const daysNum = parseInt(newMilestoneDays);
    if (isNaN(daysNum) || daysNum <= 0) {
      setError("'Days' must be a positive number for new milestone.");
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const milestonesCollectionRef = collection(db, "milestones");
      await addDoc(milestonesCollectionRef, {
        days: daysNum,
        title: newMilestoneTitle.trim(),
      });
      setNewMilestoneDays('');
      setNewMilestoneTitle('');
      await fetchMilestones(); 
    } catch (err) {
      console.error("Error adding milestone:", err);
      setError("Failed to add milestone. " + err.message);
    }
    setIsSubmitting(false);
  };

  const handleDeleteMilestone = async (milestoneId) => {
    if (!window.confirm("Are you sure you want to delete this milestone? This action cannot be undone.")) {
        return;
    }
    setError('');
    try {
        const milestoneDocRef = doc(db, "milestones", milestoneId);
        await deleteDoc(milestoneDocRef);
        await fetchMilestones(); 
    } catch (err) {
        console.error("Error deleting milestone:", err);
        setError("Failed to delete milestone. " + err.message);
    }
  };

  const handleOpenEditModal = (milestone) => {
    setEditingMilestone(milestone);
    setEditDays(String(milestone.days)); 
    setEditTitle(milestone.title);
    setIsEditModalOpen(true);
    setError(''); 
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingMilestone(null);
    setEditDays('');
    setEditTitle('');
  };

  const handleUpdateMilestone = async (e) => {
    e.preventDefault();
    if (!editingMilestone || !editDays || !editTitle.trim()) {
        setError("Both 'Days' and 'Title' are required for editing.");
        return;
    }
    const daysNum = parseInt(editDays);
    if (isNaN(daysNum) || daysNum <= 0) {
        setError("'Days' must be a positive number for editing.");
        return;
    }

    setIsSubmitting(true); 
    setError('');
    try {
        const milestoneDocRef = doc(db, "milestones", editingMilestone.id);
        await updateDoc(milestoneDocRef, {
            days: daysNum,
            title: editTitle.trim()
        });
        await fetchMilestones();
        handleCloseEditModal();
    } catch (err) {
        console.error("Error updating milestone:", err);
        setError("Failed to update milestone. " + err.message);
    }
    setIsSubmitting(false);
  };

  const handleLogout = async () => { // This function will now be used by the button
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-800 text-white p-4 md:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-10 pb-4 border-b border-slate-700">
        <h1 className="text-3xl font-bold text-sky-400 mb-4 sm:mb-0">Admin Panel</h1>
        <div>
          {/* 'Link' is now used */}
          <Link to="/" className="text-sky-400 hover:text-sky-300 mr-4 text-sm sm:text-base">Go to App</Link>
          {/* 'handleLogout' is now used */}
          <button onClick={handleLogout} className="text-sm sm:text-base text-red-400 hover:text-red-300">
            Log Out
          </button>
        </div>
      </header>
      
      {error && <p className="p-3 mb-4 bg-red-500 text-white rounded text-center">{error}</p>}

      {/* Section to Add New Milestone - 'handleAddMilestone' is now used by onSubmit */}
      <div className="bg-slate-700 p-6 rounded-lg shadow-xl mb-10">
        <h2 className="text-2xl font-semibold text-white mb-6">Add New Milestone</h2>
        <form onSubmit={handleAddMilestone} className="space-y-4">
          <div>
            <label htmlFor="milestoneDays" className="block text-sm font-medium text-slate-300 mb-1">Days (e.g., 7, 30, 365)</label>
            <input
              type="number"
              id="milestoneDays"
              value={newMilestoneDays}
              onChange={(e) => setNewMilestoneDays(e.target.value)}
              placeholder="Number of days"
              required
              className="w-full p-3 text-gray-200 bg-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-500"
            />
          </div>
          <div>
            <label htmlFor="milestoneTitle" className="block text-sm font-medium text-slate-300 mb-1">Title (e.g., "1 Week Sober")</label>
            <input
              type="text"
              id="milestoneTitle"
              value={newMilestoneTitle}
              onChange={(e) => setNewMilestoneTitle(e.target.value)}
              placeholder="Celebration Title"
              required
              className="w-full p-3 text-gray-200 bg-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-500"
            />
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto py-2 px-6 bg-green-600 hover:bg-green-700 rounded-md text-white font-semibold transition-colors disabled:opacity-50">
            {isSubmitting ? 'Adding...' : 'Add Milestone'}
          </button>
        </form>
      </div>

      {/* Section to Display Current Milestones */}
      <div className="bg-slate-700 p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl font-semibold text-white mb-6">Current Milestones</h2>
        {isLoading ? (
          <p className="text-slate-300">Loading milestones...</p>
        ) : milestones.length === 0 ? (
          <p className="text-slate-300">No milestones found. Add some using the form above!</p>
        ) : (
          <ul className="space-y-3">
            {milestones.map((milestone) => (
              <li key={milestone.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-600 rounded-md border border-slate-500">
                <div className="mb-2 sm:mb-0">
                  <p className="font-semibold text-lg">{milestone.title}</p>
                  <p className="text-sm text-slate-400">{milestone.days} days</p>
                </div>
                <div className="flex space-x-2 self-end sm:self-center">
                  <button 
                    onClick={() => handleOpenEditModal(milestone)}
                    className="text-xs py-1 px-3 bg-yellow-500 hover:bg-yellow-600 rounded-md text-white font-semibold transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteMilestone(milestone.id)} 
                    className="text-xs py-1 px-3 bg-red-600 hover:bg-red-700 rounded-md text-white font-semibold transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal for Editing Milestones */}
      {editingMilestone && (
        <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title="Edit Milestone">
          <form onSubmit={handleUpdateMilestone} className="space-y-4">
            <div>
              <label htmlFor="editMilestoneDays" className="block text-sm font-medium text-slate-700 mb-1">Days</label>
              <input
                type="number"
                id="editMilestoneDays"
                value={editDays}
                onChange={(e) => setEditDays(e.target.value)}
                required
                className="w-full p-3 text-gray-700 bg-slate-50 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-300"
              />
            </div>
            <div>
              <label htmlFor="editMilestoneTitle" className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input
                type="text"
                id="editMilestoneTitle"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                className="w-full p-3 text-gray-700 bg-slate-50 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-300"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={handleCloseEditModal} className="py-2 px-4 bg-slate-500 hover:bg-slate-600 rounded-md text-white font-semibold transition-colors">
                    Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="py-2 px-4 bg-sky-600 hover:bg-sky-700 rounded-md text-white font-semibold transition-colors disabled:opacity-50">
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}