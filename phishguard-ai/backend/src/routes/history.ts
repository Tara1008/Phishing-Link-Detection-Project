import { Router } from 'express';
import { getHistory, deleteScan, clearHistory, getScanById } from '../db/queries';
import { toCSV, toJSON } from '../modules/reportGenerator';

const router = Router();

/** GET /api/history?limit=50&offset=0&session_id=xxx */
router.get('/', async (req, res) => {
  try {
    const limit     = Math.min(Number(req.query.limit  ?? 50), 200);
    const offset    = Number(req.query.offset ?? 0);
    const sessionId = req.query.session_id as string | undefined;

    const rows = await getHistory(limit, offset, sessionId);
    res.json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    console.error('History fetch error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
});

/** GET /api/history/:id */
router.get('/:id', async (req, res) => {
  try {
    const id   = Number(req.params.id);
    const scan = await getScanById(id);
    if (!scan) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: scan });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch scan' });
  }
});

/** DELETE /api/history/clear  — clear all */
router.delete('/clear', async (req, res) => {
  try {
    const sessionId = req.query.session_id as string | undefined;
    const deleted   = await clearHistory(sessionId);
    res.json({ success: true, deleted });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to clear history' });
  }
});

/** DELETE /api/history/:id */
router.delete('/:id', async (req, res) => {
  try {
    const id  = Number(req.params.id);
    const ok  = await deleteScan(id);
    if (!ok) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete scan' });
  }
});

/** GET /api/history/:id/export?format=json|csv */
router.get('/:id/export', async (req, res) => {
  try {
    const id     = Number(req.params.id);
    const format = (req.query.format as string) ?? 'json';
    const scan   = await getScanById(id);
    if (!scan) return res.status(404).json({ success: false, error: 'Not found' });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="phishguard-${id}.csv"`);
      return res.send(toCSV([scan]));
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="phishguard-${id}.json"`);
    return res.json(toJSON(scan));
  } catch (err) {
    res.status(500).json({ success: false, error: 'Export failed' });
  }
});

export default router;
