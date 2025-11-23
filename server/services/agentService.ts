import prisma from '../db/client.js';
import type { Agent, AgentStatus, HireEvent, Task, MarketplaceStats } from '../types/index.js';

export interface AgentWithHistory extends Agent {
  employerHireEvents: HireEvent[];
  workerHireEvents: HireEvent[];
  employerTasks: Task[];
  workerTasks: Task[];
}

function parseAgent(dbAgent: {
  id: string;
  name: string;
  bio: string;
  age: number;
  avatarUrl: string;
  walletAddress: string;
  creditsBalance: number;
  role: string;
  status: string;
  skills: string;
  specialization: string;
  cooldownEndsAt: bigint | null;
  createdAt: bigint;
}): Agent {
  return {
    ...dbAgent,
    role: dbAgent.role as Agent['role'],
    status: dbAgent.status as AgentStatus,
    skills: JSON.parse(dbAgent.skills) as string[],
    cooldownEndsAt: dbAgent.cooldownEndsAt != null ? Number(dbAgent.cooldownEndsAt) : null,
    createdAt: Number(dbAgent.createdAt),
  };
}

export async function getAll(): Promise<Agent[]> {
  const agents = await prisma.agent.findMany();
  return agents.map(parseAgent);
}

export async function getById(id: string): Promise<AgentWithHistory | null> {
  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      employerHireEvents: true,
      workerHireEvents: true,
      employerTasks: true,
      workerTasks: true,
    },
  });

  if (!agent) return null;

  const convertHireEvent = (e: any): HireEvent => ({
    id: e.id,
    employerAgentId: e.employerAgentId,
    workerAgentId: e.workerAgentId,
    creditsAmount: e.creditsAmount,
    negotiationId: e.negotiationId,
    timestamp: Number(e.timestamp),
  });

  const convertTask = (t: any): Task => ({
    id: t.id,
    employerAgentId: t.employerAgentId,
    title: t.title,
    description: t.description,
    status: t.status as Task['status'],
    hireEventId: t.hireEventId ?? null,
    assignedWorkerId: t.assignedWorkerId ?? null,
    createdAt: Number(t.createdAt),
    completedAt: t.completedAt != null ? Number(t.completedAt) : null,
  });

  return {
    ...parseAgent(agent),
    employerHireEvents: agent.employerHireEvents.map(convertHireEvent),
    workerHireEvents: agent.workerHireEvents.map(convertHireEvent),
    employerTasks: agent.employerTasks.map(convertTask),
    workerTasks: agent.workerTasks.map(convertTask),
  };
}

export async function updateStatus(id: string, status: AgentStatus): Promise<Agent> {
  const agent = await prisma.agent.update({
    where: { id },
    data: { status },
  });
  return parseAgent(agent);
}

export async function updateBalance(id: string, newBalance: number): Promise<Agent> {
  const agent = await prisma.agent.update({
    where: { id },
    data: { creditsBalance: newBalance },
  });
  return parseAgent(agent);
}

export async function updateRole(id: string, role: 'worker' | 'employer'): Promise<Agent> {
  const agent = await prisma.agent.update({
    where: { id },
    data: { role },
  });
  return parseAgent(agent);
}

export async function getStats(): Promise<MarketplaceStats> {
  const [totalAgents, balanceResult, activeHireEvents, activeNegotiations] = await Promise.all([
    prisma.agent.count(),
    prisma.agent.aggregate({ _sum: { creditsBalance: true } }),
    prisma.hireEvent.count({
      where: {
        worker: { status: 'cooldown' },
      },
    }),
    prisma.negotiation.count({
      where: { status: 'active' },
    }),
  ]);

  return {
    totalAgents,
    totalCreditsInCirculation: balanceResult._sum.creditsBalance ?? 0,
    activeHireEvents,
    activeNegotiations,
  };
}
