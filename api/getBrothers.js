import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return res.status(500).json({ error: 'Supabase is not configured on the server yet.' });
  }

  const supabase = createClient(url, anonKey);
  const { data, error } = await supabase
    .from('brothers')
    .select('id, name')
    .order('created_at', { ascending: true });

  if (error) {
    return res.status(500).json({ error: 'Unable to load brothers list', details: error.message });
  }

  return res.status(200).json({ brothers: data });
}
