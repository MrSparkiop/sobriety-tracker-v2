const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const users = [];
const milestones = [];
const profiles = {};
const journals = {};
const moodCheckins = {};
const sessions = {};

function createSession(userId) {
  const token = uuidv4();
  sessions[token] = userId;
  return token;
}

function auth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (sessions[token]) {
    req.userId = sessions[token];
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

app.post('/api/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  if (users.find(u => u.email === email)) return res.status(400).json({ error: 'User exists' });
  const user = { id: uuidv4(), email, password, isDisabledByAdmin: false };
  users.push(user);
  const token = createSession(user.id);
  res.json({ user: { id: user.id, email: user.email }, token });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = createSession(user.id);
  res.json({ user: { id: user.id, email: user.email }, token });
});

app.post('/api/logout', auth, (req, res) => {
  const token = Object.keys(sessions).find(t => sessions[t] === req.userId);
  if (token) delete sessions[token];
  res.json({ success: true });
});

app.get('/api/me', auth, (req, res) => {
  const user = users.find(u => u.id === req.userId);
  res.json(user ? { id: user.id, email: user.email } : null);
});

app.get('/api/milestones', (req, res) => {
  res.json(milestones);
});

app.post('/api/milestones', auth, (req, res) => {
  const { days, title } = req.body;
  const m = { id: uuidv4(), days, title };
  milestones.push(m);
  res.json(m);
});

app.put('/api/milestones/:id', auth, (req, res) => {
  const m = milestones.find(x => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: 'Not found' });
  m.days = req.body.days;
  m.title = req.body.title;
  res.json(m);
});

app.delete('/api/milestones/:id', auth, (req, res) => {
  const idx = milestones.findIndex(x => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  milestones.splice(idx, 1);
  res.json({ success: true });
});

app.get('/api/users', auth, (req, res) => {
  res.json(users.map(u => ({ id: u.id, email: u.email, isDisabledByAdmin: u.isDisabledByAdmin })));
});

app.get('/api/users/:id', auth, (req, res) => {
  const u = users.find(x => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'Not found' });
  res.json({ id: u.id, email: u.email, isDisabledByAdmin: u.isDisabledByAdmin });
});

app.post('/api/users/:id/toggle', auth, (req, res) => {
  const u = users.find(x => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'Not found' });
  const { disable } = req.body;
  u.isDisabledByAdmin = !!disable;
  res.json({ success: true, message: `User ${u.id} has been ${disable ? 'disabled' : 'enabled'}.` });
});

app.get('/api/users/:id/profile', auth, (req, res) => {
  res.json(profiles[req.params.id] || null);
});

app.post('/api/users/:id/profile', auth, (req, res) => {
  const { startDate } = req.body;
  profiles[req.params.id] = { ...(profiles[req.params.id] || { achieved_milestones: [] }), start_date: startDate };
  res.json(profiles[req.params.id]);
});

app.post('/api/users/:id/profile/milestones', auth, (req, res) => {
  const { achieved } = req.body;
  profiles[req.params.id] = { ...(profiles[req.params.id] || {}), achieved_milestones: achieved };
  res.json(profiles[req.params.id]);
});

app.get('/api/users/:id/journal', auth, (req, res) => {
  res.json(journals[req.params.id] || []);
});

app.post('/api/users/:id/journal', auth, (req, res) => {
  const entry = { id: uuidv4(), text: req.body.text, timestamp: new Date() };
  if (!journals[req.params.id]) journals[req.params.id] = [];
  journals[req.params.id].unshift(entry);
  res.json(entry);
});

app.delete('/api/users/:id/journal/:entryId', auth, (req, res) => {
  const list = journals[req.params.id] || [];
  const idx = list.findIndex(e => e.id === req.params.entryId);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  list.splice(idx, 1);
  res.json({ success: true });
});

app.get('/api/users/:id/mood-checkin', auth, (req, res) => {
  const date = req.query.date;
  res.json(moodCheckins[req.params.id]?.[date] || null);
});

app.post('/api/users/:id/mood-checkin', auth, (req, res) => {
  const { date_string } = req.body;
  if (!moodCheckins[req.params.id]) moodCheckins[req.params.id] = {};
  moodCheckins[req.params.id][date_string] = req.body;
  res.json(req.body);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
