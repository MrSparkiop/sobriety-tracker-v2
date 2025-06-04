const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

app.post('/toggleUserActivation', async (req, res) => {
  const { uid, disable } = req.body;
  if (!uid || typeof disable !== 'boolean') {
    return res.status(400).json({ success: false, message: 'Invalid parameters' });
  }
  try {
    await supabase.auth.admin.updateUserById(uid, { disabled: disable });
    await supabase.from('users').update({ is_disabled_by_admin: disable }).eq('id', uid);
    res.json({ success: true, message: `User ${uid} has been ${disable ? 'disabled' : 'enabled'}.` });
  } catch (error) {
    console.error('Error toggling user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
