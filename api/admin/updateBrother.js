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
  const name = (req.body?.name || '').trim();
  if (!id || !name) {
    return res.status(400).json({ error: 'Id and name are required' });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('brothers')
      .update({ name })
      .eq('id', id)
      .select('id, name')
      .single();

    if (error) throw error;

    return res.status(200).json({ brother: data });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to update brother', details: error.message });
  }
}
