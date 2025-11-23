import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../db/client.js';

const router = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

function convertNegotiation(neg: any) {
  return {
    ...neg,
    startedAt: Number(neg.startedAt),
    endedAt: neg.endedAt != null ? Number(neg.endedAt) : null,
    messages: neg.messages?.map((m: any) => ({
      ...m,
      timestamp: Number(m.timestamp),
    })) ?? [],
  };
}
router.get(
  '/api/negotiations',
  asyncHandler(async (_req, res) => {
    const negotiations = await prisma.negotiation.findMany({
      where: {
        OR: [
          { status: 'active' },
          { status: { in: ['agreed', 'rejected'] } },
        ],
      },
      include: { messages: { orderBy: { timestamp: 'asc' } } },
      orderBy: { startedAt: 'desc' },
      take: 100,
    });
    res.json(negotiations.map(convertNegotiation));
  })
);

router.get(
  '/api/negotiations/:id',
  asyncHandler(async (req, res) => {
    const negotiation = await prisma.negotiation.findUnique({
      where: { id: req.params.id as string },
      include: { messages: { orderBy: { timestamp: 'asc' } } },
    });
    if (!negotiation) {
      res.status(404).json({ error: 'Negotiation not found' });
      return;
    }
    res.json(convertNegotiation(negotiation));
  })
);

export default router;
