export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { brothers } = req.body || {};
  if (!Array.isArray(brothers) || brothers.length === 0) {
    return res.status(400).json({ error: 'Brothers list must be a non-empty array' });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return res.status(500).json({ error: 'GITHUB_TOKEN is not configured' });
  }

  const owner = 'Ishor22';
  const repo = 'goupwebsite';
  const path = 'brothers.json';
  const branch = 'main';
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

  try {
    const fileResponse = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!fileResponse.ok) {
      const errorText = await fileResponse.text();
      return res.status(500).json({ error: 'Unable to read brothers.json', details: errorText });
    }

    const fileData = await fileResponse.json();
    const content = Buffer.from(JSON.stringify({ brothers }, null, 2), 'utf-8').toString('base64');

    const updateResponse = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Update brothers list from admin site',
        content,
        sha: fileData.sha,
        branch,
      }),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      return res.status(500).json({ error: 'Unable to update brothers.json', details: errorText });
    }

    const updateData = await updateResponse.json();
    return res.status(200).json({ message: 'Saved successfully', commitUrl: updateData.commit.html_url });
  } catch (error) {
    return res.status(500).json({ error: 'Unexpected error', details: error.message });
  }
}
