// File: pages/api/session/[id].js
import { getSession, updateSessionVariations } from '@/lib/db';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const session = getSession(id);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      return res.status(200).json(session);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch session' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { variations } = req.body;
      const session = getSession(id);
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const updated = updateSessionVariations(id, variations);
      return res.status(200).json(updated);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update session' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
