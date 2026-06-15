import { Router } from 'express';
import { SeatService } from '../services/SeatService';

const router = Router();

router.get('/', (_req, res) => {
  const seats = SeatService.getAllSeats();
  res.json({ success: true, data: seats });
});

router.get('/:id', (req, res) => {
  const seat = SeatService.getSeat(req.params.id);
  if (!seat) {
    return res.status(404).json({ success: false, error: '座位不存在' });
  }
  res.json({ success: true, data: seat });
});

router.put('/:id', (req, res) => {
  const updated = SeatService.updateSeat(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: '座位不存在' });
  }
  res.json({ success: true, data: updated });
});

router.post('/:id/pause', (req, res) => {
  const updated = SeatService.togglePause(req.params.id);
  if (!updated) {
    return res.status(404).json({ success: false, error: '座位不存在' });
  }
  res.json({ success: true, data: updated });
});

router.post('/:id/start', (req, res) => {
  const { patientName, duration } = req.body;
  if (!patientName || !duration) {
    return res.status(400).json({ success: false, error: '缺少必要参数' });
  }
  const updated = SeatService.startInfusion(req.params.id, patientName, Number(duration));
  if (!updated) {
    return res.status(404).json({ success: false, error: '座位不存在' });
  }
  res.json({ success: true, data: updated });
});

router.post('/:id/end', (req, res) => {
  const updated = SeatService.endInfusion(req.params.id);
  if (!updated) {
    return res.status(404).json({ success: false, error: '座位不存在' });
  }
  res.json({ success: true, data: updated });
});

export default router;
