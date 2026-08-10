// Serves the public Supabase project URL and anon key to the browser.
// The anon key is designed by Supabase to be public (it can only do what
// the database's row-level security policies allow); we still keep it out
// of the repo and read it from Vercel environment variables so nothing
// project-specific is hard-coded in source control.
export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return res.status(500).json({ error: 'Supabase is not configured on the server yet.' });
  }

  return res.status(200).json({ url, anonKey });
}
