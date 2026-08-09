export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { brothers } = req.body || {};
  if (!Array.isArray(brothers) || brothers.length === 0) {
    return res.status(400).json({ error: 'Brothers list must be a non-empty array' });
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || 'ishor22/goupwebsite';
  const branch = process.env.GITHUB_BRANCH || 'main';

  if (!token) {
    return res.status(500).json({
      error: 'Server is not configured to save changes. Missing GITHUB_TOKEN environment variable.',
    });
  }

  const apiUrl = `https://api.github.com/repos/${repo}/contents/brothers.json`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };

  try {
    const currentFileResponse = await fetch(`${apiUrl}?ref=${branch}`, { headers });
    if (!currentFileResponse.ok) {
      const details = await currentFileResponse.text();
      throw new Error(`Unable to read current file from GitHub: ${details}`);
    }
    const currentFile = await currentFileResponse.json();

    const content = JSON.stringify({ brothers }, null, 2) + '\n';
    const encodedContent = Buffer.from(content, 'utf8').toString('base64');

    const updateResponse = await fetch(apiUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: 'Update brothers list via admin panel',
        content: encodedContent,
        sha: currentFile.sha,
        branch,
      }),
    });

    if (!updateResponse.ok) {
      const details = await updateResponse.text();
      throw new Error(`GitHub commit failed: ${details}`);
    }

    return res.status(200).json({ message: 'Saved successfully. The site will update shortly after redeploy.' });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to save brothers list', details: error.message });
  }
}
