import { Router } from 'express';
import { CallService } from '../services/CallService';
import { memoryStore } from '../stores/MemoryStore';

const router = Router();

router.get('/', (req, res) => {
  const { status, type } = req.query as { status?: string; type?: string };
  const calls = memoryStore.getCalls({ status, type });
  res.json({ success: true, data: calls });
});

router.post('/', (req, res) => {
  const { seatId, type, abnormalType } = req.body;
  if (!seatId || !type) {
    return res.status(400).json({ success: false, error: '缺少必要参数' });
  }
  const result = CallService.createCall(seatId, type, abnormalType);

  if (result.isPaused) {
    return res.status(400).json({
      success: false,
      error: '座位已暂停',
      isPaused: true,
      message: '当前座位呼叫功能已临时暂停，请联系护士恢复后再使用'
    });
  }

  if (result.isDuplicate) {
    return res.status(409).json({
      success: false,
      error: '该座位已有未处理的呼叫',
      isDuplicate: true,
      duplicateType: result.duplicateType,
      existingCall: result.call,
      message: `当前座位已有【${result.duplicateType ? typeLabel(result.duplicateType) : ''}】请求等待处理，请先完成或取消当前呼叫`
    });
  }

  if (!result.call) {
    return res.status(404).json({ success: false, error: '座位不存在' });
  }

  res.json({
    success: true,
    data: result.call,
    isMerged: result.isMerged,
    mergedIntoCall: result.mergedIntoCall
  });
});

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    medication: '加药',
    remove_needle: '拔针',
    hemostasis: '止血',
    consultation: '咨询',
    abnormal: '异常',
    other: '其他'
  };
  return labels[type] || type;
}

router.put('/:id/accept', (req, res) => {
  const { nurseName } = req.body;
  if (!nurseName) {
    return res.status(400).json({ success: false, error: '缺少护士姓名' });
  }
  const call = CallService.acceptCall(req.params.id, nurseName);
  if (!call) {
    return res.status(404).json({ success: false, error: '呼叫不存在或状态错误' });
  }
  res.json({ success: true, data: call });
});

router.put('/:id/complete', (req, res) => {
  const { remark } = req.body;
  const call = CallService.completeCall(req.params.id, remark);
  if (!call) {
    return res.status(404).json({ success: false, error: '呼叫不存在或状态错误' });
  }
  res.json({ success: true, data: call });
});

router.put('/:id/cancel', (_req, res) => {
  const call = CallService.cancelCall(_req.params.id);
  if (!call) {
    return res.status(404).json({ success: false, error: '呼叫不存在或状态错误' });
  }
  res.json({ success: true, data: call });
});

router.put('/merge', (req, res) => {
  const { mainId, mergeIds } = req.body;
  if (!mainId || !Array.isArray(mergeIds)) {
    return res.status(400).json({ success: false, error: '参数错误' });
  }
  const mainCall = memoryStore.getCallById(mainId);
  if (!mainCall) {
    return res.status(404).json({ success: false, error: '主呼叫不存在' });
  }
  memoryStore.updateCall(mainId, { mergedIds: [...(mainCall.mergedIds || []), ...mergeIds] });
  mergeIds.forEach((id: string) => {
    memoryStore.updateCall(id, { status: 'cancelled' });
  });
  res.json({ success: true, data: memoryStore.getCallById(mainId) });
});

export default router;
