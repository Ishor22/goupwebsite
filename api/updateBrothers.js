import fs from 'fs/promises';

const TMP_PATH = '/tmp/brothers.json';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { brothers } = req.body || {};
  if (!Array.isArray(brothers) || brothers.length === 0) {
    return res.status(400).json({ error: 'Brothers list must be a non-empty array' });
  }

  const content = JSON.stringify({ brothers }, null, 2) + '\n';

  try {
    await fs.writeFile(TMP_PATH, content, 'utf8');
    return res.status(200).json({
      message: 'Saved. This storage is temporary and may reset when the server restarts or redeploys.',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to save brothers list', details: error.message });
  }
}
