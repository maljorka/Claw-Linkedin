import prisma from './db/client.js';
import { processCooldowns } from './simulation/cooldownManager.js';

const VALID_ROLES = ['worker', 'employer'];
const VALID_STATUSES = ['active', 'inactive', 'negotiating', 'cooldown'];

export async function validateAndRepairAgents(): Promise<void> {
  const agents = await prisma.agent.findMany();
  const now = Date.now();
  let repaired = 0;

  for (const agent of agents) {
    const updates: Record<string, unknown> = {};

    if (agent.creditsBalance < 0) {
      updates.creditsBalance = 0;
    }

    if (!VALID_ROLES.includes(agent.role)) {
      updates.role = 'worker';
    }

    if (!VALID_STATUSES.includes(agent.status)) {
      updates.status = 'active';
    }

    if (agent.status === 'cooldown' && agent.cooldownEndsAt != null && agent.cooldownEndsAt <= now) {
      updates.status = 'active';
      updates.cooldownEndsAt = null;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.agent.update({ where: { id: agent.id }, data: updates });
      repaired++;
    }
  }

  await processCooldowns();
}
