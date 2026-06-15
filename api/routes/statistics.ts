import { Router } from 'express';
import { StatService } from '../services/StatService';

const router = Router();

router.get('/', (_req, res) => {
  const stats = StatService.getStatistics();
  res.json({ success: true, data: stats });
});

router.get('/records', (req, res) => {
  const { dateFrom, dateTo, type } = req.query as { dateFrom?: string; dateTo?: string; type?: string };
  const records = StatService.getRecords({ dateFrom, dateTo, type });
  res.json({ success: true, data: records });
});

export default router;
