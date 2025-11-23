import prisma from '../db/client.js';
import * as creditService from '../services/creditService.js';
import * as agentService from '../services/agentService.js';
import type { HireEvent } from '../types/index.js';
import { assignCooldown } from './cooldownManager.js';

export async function processHire(
  negotiationId: string,
  employerAgentId: string,
  workerAgentId: string,
  agreedAmount: number,
): Promise<(HireEvent & { taskId?: string }) | null> {
  const existing = await prisma.hireEvent.findUnique({
    where: { negotiationId },
    select: { id: true },
  });
  if (existing) return null;

  const result = await creditService.transfer(employerAgentId, workerAgentId, agreedAmount);

  if (!result.success) {
    await Promise.all([
      agentService.updateStatus(employerAgentId, 'active'),
      agentService.updateStatus(workerAgentId, 'active'),
    ]);
    return null;
  }

  const now = Date.now();
  const hireEvent = await prisma.hireEvent.create({
    data: {
      employerAgentId,
      workerAgentId,
      negotiationId,
      creditsAmount: agreedAmount,
      timestamp: now,
    },
  });

  let taskId: string | undefined;
  const openTask = await prisma.task.findFirst({
    where: { employerAgentId, status: 'open' },
  });

  if (openTask) {
    await prisma.task.update({
      where: { id: openTask.id },
      data: {
        status: 'in_progress',
        hireEventId: hireEvent.id,
        assignedWorkerId: workerAgentId,
      },
    });
    taskId = openTask.id;
  }

  await agentService.updateStatus(workerAgentId, 'cooldown');
  await assignCooldown(workerAgentId);

  await agentService.updateStatus(employerAgentId, 'active');

  return {
    id: hireEvent.id,
    employerAgentId: hireEvent.employerAgentId,
    workerAgentId: hireEvent.workerAgentId,
    creditsAmount: hireEvent.creditsAmount,
    negotiationId: hireEvent.negotiationId,
    timestamp: Number(hireEvent.timestamp),
    taskId,
  };
}
