import { verifyAdmin } from '../_lib/verifyAdmin.js';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let user;
  try {
    user = await verifyAdmin(req);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.body || {};
  if (!id) {
    return res.status(400).json({ error: 'Id is required' });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.from('brothers').delete().eq('id', id);

    if (error) throw error;

    return res.status(200).json({ message: 'Deleted' });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to delete brother', details: error.message });
  }
}
