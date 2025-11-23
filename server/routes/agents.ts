import { Router, Request, Response, NextFunction } from 'express';
import * as agentService from '../services/agentService.js';

const router = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.get(
  '/api/agents',
  asyncHandler(async (_req, res) => {
    const agents = await agentService.getAll();
    res.json(agents);
  })
);

router.get(
  '/api/agents/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const agent = await agentService.getById(id);
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    res.json(agent);
  })
);

export default router;
