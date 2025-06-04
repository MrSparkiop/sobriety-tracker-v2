import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; // Link is used for navigation
import { useAuth } from '../context/AuthContext';
import { api } from '../apiClient';
import Modal from './Modal';

export default function AdminPage() {
  const { auth } = useAuth();

  const [milestones, setMilestones] = useState([]);
  const [isLoadingMilestones, setIsLoadingMilestones] = useState(true); // Renamed for clarity
  const [milestoneError, setMilestoneError] = useState(''); // Renamed for clarity
  
  const [newMilestoneDays, setNewMilestoneDays] = useState('');
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [isSubmittingMilestone, setIsSubmittingMilestone] = useState(false); 

  const [editingMilestone, setEditingMilestone] = useState(null);
  const [editDays, setEditDays] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // --- NEW: State for listing users ---
  const [allUsers, setAllUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [userListError, setUserListError] = useState('');

  // Fetch Milestones
  const fetchMilestones = useCallback(async () => {
    setIsLoadingMilestones(true);
    setMilestoneError('');
    try {
      const data = await api.getMilestones();
      setMilestones(data || []);
    } catch (error) {
      console.error('Error fetching milestones:', error);
      setMilestoneError('Failed to load milestones.');
    }
    setIsLoadingMilestones(false);
  }, []);

  // --- NEW: Fetch Users ---
  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    setUserListError('');
    try {
      const data = await api.getUsers();
      setAllUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUserListError('Failed to load users.');
    }
    setIsLoadingUsers(false);
  }, []);

  useEffect(() => {
    fetchMilestones();
    fetchUsers(); // Fetch users when component mounts
  }, [fetchMilestones, fetchUsers]);

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!newMilestoneDays || !newMilestoneTitle.trim()) {
      setMilestoneError("Both 'Days' and 'Title' are required for new milestone.");
      return;
    }
    const daysNum = parseInt(newMilestoneDays);
    if (isNaN(daysNum) || daysNum <= 0) {
      setMilestoneError("'Days' must be a positive number for new milestone.");
      return;
    }

    setIsSubmittingMilestone(true);
    setMilestoneError('');
    try {
      await api.addMilestone(daysNum, newMilestoneTitle.trim());
      setNewMilestoneDays('');
      setNewMilestoneTitle('');
      await fetchMilestones();
    } catch (err) {
      console.error("Error adding milestone:", err);
      setMilestoneError("Failed to add milestone. " + err.message);
    }
    setIsSubmittingMilestone(false);
  };

  const handleDeleteMilestone = async (milestoneId) => {
    if (!window.confirm("Are you sure you want to delete this milestone? This action cannot be undone.")) {
        return;
    }
    setMilestoneError('');
    try {
        await api.deleteMilestone(milestoneId);
        await fetchMilestones();
    } catch (err) {
        console.error("Error deleting milestone:", err);
        setMilestoneError("Failed to delete milestone. " + err.message);
    }
  };

  const handleOpenEditModal = (milestone) => {
    setEditingMilestone(milestone);
    setEditDays(String(milestone.days)); 
    setEditTitle(milestone.title);
    setIsEditModalOpen(true);
    setMilestoneError(''); 
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
        setMilestoneError("Both 'Days' and 'Title' are required for editing.");
        return;
    }
    const daysNum = parseInt(editDays);
    if (isNaN(daysNum) || daysNum <= 0) {
        setMilestoneError("'Days' must be a positive number for editing.");
        return;
    }

    setIsSubmittingMilestone(true); 
    setMilestoneError('');
    try {
        await api.updateMilestone(editingMilestone.id, daysNum, editTitle.trim());
        await fetchMilestones();
        handleCloseEditModal();
    } catch (err) {
        console.error("Error updating milestone:", err);
        setMilestoneError("Failed to update milestone. " + err.message);
    }
    setIsSubmittingMilestone(false);
  };

  const handleLogout = async () => {
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
          <Link to="/" className="text-sky-400 hover:text-sky-300 mr-4 text-sm sm:text-base">Go to App</Link>
          <button onClick={handleLogout} className="text-sm sm:text-base text-red-400 hover:text-red-300">
            Log Out
          </button>
        </div>
      </header>
      
      {/* Combined Error Display Area */}
      {(milestoneError || userListError) && 
        <p className="p-3 mb-4 bg-red-500 text-white rounded text-center">
            {milestoneError} {milestoneError && userListError && <br/>} {userListError}
        </p>
      }

      {/* Section to Add New Milestone */}
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
          <button type="submit" disabled={isSubmittingMilestone} className="w-full sm:w-auto py-2 px-6 bg-green-600 hover:bg-green-700 rounded-md text-white font-semibold transition-colors disabled:opacity-50">
            {isSubmittingMilestone ? 'Adding...' : 'Add Milestone'}
          </button>
        </form>
      </div>

      {/* Section to Display Current Milestones */}
      <div className="bg-slate-700 p-6 rounded-lg shadow-xl mb-10">
        <h2 className="text-2xl font-semibold text-white mb-6">Current Milestones</h2>
        {isLoadingMilestones ? (
          <p className="text-slate-300">Loading milestones...</p>
        ) : milestones.length === 0 && !milestoneError ? (
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

      {/* --- NEW: Section to Display Users --- */}
      <div className="bg-slate-700 p-6 rounded-lg shadow-xl mt-10">
          <h2 className="text-2xl font-semibold text-white mb-6">App Users</h2>
          {isLoadingUsers ? (
              <p className="text-slate-300">Loading users...</p>
          ) : allUsers.length === 0 && !userListError ? (
              <p className="text-slate-300">No users found in the 'users' collection. Ensure you have a top-level 'users' collection where each document ID is the user's UID and contains at least an 'email' field.</p>
          ) : (
              <ul className="space-y-3">
                  {allUsers.map((user) => (
                      <li key={user.uid} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-600 rounded-md border border-slate-500">
                          <div className="mb-2 sm:mb-0">
                              <p className="font-semibold text-lg">{user.email || "No email provided"}</p>
                              <p className="text-xs text-slate-400">UID: {user.uid}</p>
                          </div>
                          <Link 
                              to={`/admin/user/${user.uid}`} 
                              className="text-xs py-1 px-3 bg-sky-600 hover:bg-sky-700 rounded-md text-white font-semibold transition-colors self-end sm:self-center"
                          >
                              View Details
                          </Link>
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
                <button type="submit" disabled={isSubmittingMilestone} className="py-2 px-4 bg-sky-600 hover:bg-sky-700 rounded-md text-white font-semibold transition-colors disabled:opacity-50">
                    {isSubmittingMilestone ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}