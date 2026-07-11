import { Router } from 'express';
import { getStats, getRecentScans } from '../db/queries';

const router = Router();

/** GET /api/stats */
router.get('/', async (_req, res) => {
  try {
    const [stats, recent] = await Promise.all([getStats(), getRecentScans(10)]);
    res.json({ success: true, data: { stats, recent } });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

export default router;
