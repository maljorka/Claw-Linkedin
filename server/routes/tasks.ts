import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../db/client.js';

const router = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.get(
  '/api/tasks',
  asyncHandler(async (_req, res) => {
    const tasks = await prisma.task.findMany();
    res.json(tasks.map((t: any) => ({
      ...t,
      createdAt: Number(t.createdAt),
      completedAt: t.completedAt != null ? Number(t.completedAt) : null,
    })));
  })
);

export default router;
