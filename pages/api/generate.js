// File: pages/api/generate.js
import { generateThumbnailVariations } from '@/lib/imageUtils';
import { getSession, updateSessionVariations } from '@/lib/db';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    // Get the session
    const session = getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Generate variations
    const variations = await generateThumbnailVariations(session.baseImage);

    // Save variations to session
    updateSessionVariations(sessionId, variations);

    return res.status(200).json({
      success: true,
      variations: variations,
    });
  } catch (error) {
    console.error('Generate error:', error);
    return res.status(500).json({ error: 'Generation failed', details: error.message });
  }
}
