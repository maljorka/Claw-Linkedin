import prisma from '../db/client.js';
import * as agentService from '../services/agentService.js';

const COOLDOWN_MIN_MS = 900_000;
const COOLDOWN_MAX_MS = 1_200_000;

export async function assignCooldown(agentId: string): Promise<number> {
  const duration = COOLDOWN_MIN_MS + Math.random() * (COOLDOWN_MAX_MS - COOLDOWN_MIN_MS);
  const cooldownEndsAt = Date.now() + Math.round(duration);

  await prisma.agent.update({
    where: { id: agentId },
    data: { cooldownEndsAt },
  });

  return cooldownEndsAt;
}

export async function processCooldowns(): Promise<string[]> {
  const now = Date.now();

  const expiredAgents = await prisma.agent.findMany({
    where: {
      status: 'cooldown',
      cooldownEndsAt: { not: null, lte: now },
    },
    select: { id: true },
  });

  const restoredIds: string[] = [];

  for (const agent of expiredAgents) {
    await prisma.agent.update({
      where: { id: agent.id },
      data: { status: 'active', cooldownEndsAt: null },
    });

    await prisma.task.updateMany({
      where: { assignedWorkerId: agent.id, status: 'in_progress' },
      data: { status: 'completed', completedAt: now },
    });

    restoredIds.push(agent.id);
  }

  return restoredIds;
}
