import { createClient } from '@supabase/supabase-js';

// Every request that modifies data must carry a valid Supabase session
// token. We verify it against Supabase itself (never trust a flag sent
// by the client) before allowing any write to happen.
export async function verifyAdmin(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return null;
  }

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Supabase client credentials are not configured.');
  }

  const supabase = createClient(url, anonKey);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return null;
  }
  return data.user;
}
