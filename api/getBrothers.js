import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const filePath = path.join(process.cwd(), 'brothers.json');

  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(raw);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Unable to read brothers.json', details: error.message });
  }
}
