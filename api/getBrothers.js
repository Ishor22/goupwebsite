import fs from 'fs/promises';
import path from 'path';

const TMP_PATH = '/tmp/brothers.json';
const DEFAULT_PATH = path.join(process.cwd(), 'brothers.json');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const raw = await fs.readFile(TMP_PATH, 'utf8').catch(() => fs.readFile(DEFAULT_PATH, 'utf8'));
    const data = JSON.parse(raw);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Unable to read brothers list', details: error.message });
  }
}
