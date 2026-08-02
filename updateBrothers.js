import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { brothers } = req.body || {};
  if (!Array.isArray(brothers) || brothers.length === 0) {
    return res.status(400).json({ error: 'Brothers list must be a non-empty array' });
  }

  const filePath = path.join(process.cwd(), 'brothers.json');
  const content = JSON.stringify({ brothers }, null, 2) + '\n';

  try {
    await fs.writeFile(filePath, content, 'utf8');
    return res.status(200).json({ message: 'Saved successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to save brothers.json', details: error.message });
  }
}
