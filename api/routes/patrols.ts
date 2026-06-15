import { Router } from 'express';
import { PatrolService } from '../services/PatrolService';

const router = Router();

router.get('/', (_req, res) => {
  const patrols = PatrolService.getAll();
  res.json({ success: true, data: patrols });
});

router.post('/', (req, res) => {
  const { scheduledTime, area } = req.body;
  if (!scheduledTime || !area) {
    return res.status(400).json({ success: false, error: '缺少必要参数' });
  }
  const patrol = PatrolService.create(Number(scheduledTime), area);
  res.json({ success: true, data: patrol });
});

router.put('/:id/complete', (req, res) => {
  const { completedBy, remark } = req.body;
  if (!completedBy) {
    return res.status(400).json({ success: false, error: '缺少完成人' });
  }
  const updated = PatrolService.complete(req.params.id, completedBy, remark);
  if (!updated) {
    return res.status(404).json({ success: false, error: '巡视任务不存在' });
  }
  res.json({ success: true, data: updated });
});

router.put('/:id/skip', (req, res) => {
  const { remark } = req.body;
  const updated = PatrolService.skip(req.params.id, remark);
  if (!updated) {
    return res.status(404).json({ success: false, error: '巡视任务不存在' });
  }
  res.json({ success: true, data: updated });
});

export default router;
