import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '';

const instance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

export const api = {
  async register(email, password) {
    const { data } = await instance.post('/api/register', { email, password });
    return data;
  },
  async login(email, password) {
    const { data } = await instance.post('/api/login', { email, password });
    return data;
  },
  async logout() {
    await instance.post('/api/logout');
  },
  async currentUser() {
    const { data } = await instance.get('/api/me');
    return data;
  },
  async getMilestones() {
    const { data } = await instance.get('/api/milestones');
    return data;
  },
  async addMilestone(days, title) {
    const { data } = await instance.post('/api/milestones', { days, title });
    return data;
  },
  async updateMilestone(id, days, title) {
    const { data } = await instance.put(`/api/milestones/${id}`, { days, title });
    return data;
  },
  async deleteMilestone(id) {
    await instance.delete(`/api/milestones/${id}`);
  },
  async getUsers() {
    const { data } = await instance.get('/api/users');
    return data;
  },
  async getUser(id) {
    const { data } = await instance.get(`/api/users/${id}`);
    return data;
  },
  async toggleUserActivation(id, disable) {
    const { data } = await instance.post(`/api/users/${id}/toggle`, { disable });
    return data;
  },
  async getProfile(userId) {
    const { data } = await instance.get(`/api/users/${userId}/profile`);
    return data;
  },
  async setStartDate(userId, startDate) {
    const { data } = await instance.post(`/api/users/${userId}/profile`, { startDate });
    return data;
  },
  async updateAchievedMilestones(userId, achieved) {
    const { data } = await instance.post(`/api/users/${userId}/profile/milestones`, { achieved });
    return data;
  },
  async getJournalEntries(userId) {
    const { data } = await instance.get(`/api/users/${userId}/journal`);
    return data;
  },
  async addJournalEntry(userId, text) {
    const { data } = await instance.post(`/api/users/${userId}/journal`, { text });
    return data;
  },
  async deleteJournalEntry(userId, entryId) {
    await instance.delete(`/api/users/${userId}/journal/${entryId}`);
  },
  async getMoodCheckin(userId, dateString) {
    const { data } = await instance.get(`/api/users/${userId}/mood-checkin`, { params: { date: dateString } });
    return data;
  },
  async saveMoodCheckin(userId, payload) {
    const { data } = await instance.post(`/api/users/${userId}/mood-checkin`, payload);
    return data;
  },
};
