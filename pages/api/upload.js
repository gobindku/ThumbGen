// File: pages/api/upload.js
import { generateSessionId } from '@/lib/imageUtils';
import { createSession } from '@/lib/db';

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
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Generate a session ID
    const sessionId = generateSessionId();

    // Create a new session
    const session = createSession(sessionId, imageData);

    return res.status(200).json({
      success: true,
      sessionId: sessionId,
      session: session,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed', details: error.message });
  }
}
