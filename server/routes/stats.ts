import { Router, Request, Response, NextFunction } from 'express';
import * as agentService from '../services/agentService.js';

const router = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.get(
  '/api/stats',
  asyncHandler(async (_req, res) => {
    const stats = await agentService.getStats();
    res.json(stats);
  })
);

export default router;
