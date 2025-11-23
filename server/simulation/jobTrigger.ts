import prisma from '../db/client.js';
import type { Agent } from '../types/index.js';
import * as agentService from '../services/agentService.js';

export function shouldTriggerJob(): boolean {
  return Math.random() < 0.20;
}

export async function selectEmployer(): Promise<Agent | null> {
  const employers = await prisma.agent.findMany({
    where: {
      role: 'employer',
      status: 'active',
    },
  });

  if (employers.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * employers.length);
  const selected = employers[randomIndex];
  return agentService.getById(selected.id);
}

export async function selectWorker(): Promise<Agent | null> {
  const workers = await prisma.agent.findMany({
    where: {
      role: 'worker',
      status: 'active',
    },
  });

  if (workers.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * workers.length);
  const selected = workers[randomIndex];
  return agentService.getById(selected.id);
}

export async function triggerJobNeed(): Promise<{ employer: Agent; worker: Agent } | null> {
  if (!shouldTriggerJob()) return null;

  const employer = await selectEmployer();
  if (!employer) return null;

  const worker = await selectWorker();
  if (!worker) return null;

  return { employer, worker };
}
