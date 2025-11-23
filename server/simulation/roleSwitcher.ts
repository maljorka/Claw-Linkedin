import prisma from '../db/client.js';
import * as agentService from '../services/agentService.js';

const EMPLOYER_LOW_THRESHOLD = 300;
const WORKER_HIGH_THRESHOLD = 1500;

export async function checkAndSwitchRoles(): Promise<
  { agentId: string; newRole: 'worker' | 'employer' }[]
> {
  const activeAgents = await prisma.agent.findMany({
    where: { status: 'active' },
    select: { id: true, role: true, creditsBalance: true },
  });

  const changes: { agentId: string; newRole: 'worker' | 'employer' }[] = [];

  for (const agent of activeAgents) {
    if (agent.role === 'employer' && agent.creditsBalance < EMPLOYER_LOW_THRESHOLD) {
      await agentService.updateRole(agent.id, 'worker');
      changes.push({ agentId: agent.id, newRole: 'worker' });
    } else if (agent.role === 'worker' && agent.creditsBalance > WORKER_HIGH_THRESHOLD) {
      await agentService.updateRole(agent.id, 'employer');
      changes.push({ agentId: agent.id, newRole: 'employer' });
    }
  }

  return changes;
}
