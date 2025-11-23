import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma client
vi.mock('../../server/db/client', () => ({
  default: {
    agent: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock cooldownManager
vi.mock('../../server/simulation/cooldownManager', () => ({
  processCooldowns: vi.fn().mockResolvedValue([]),
}));

import prisma from '../../server/db/client';
import { validateAndRepairAgents } from '../../server/startup';

const mockFindMany = prisma.agent.findMany as ReturnType<typeof vi.fn>;
const mockUpdate = prisma.agent.update as ReturnType<typeof vi.fn>;

function makeAgent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'agent-1',
    name: 'Test Agent',
    bio: 'A test agent',
    age: 25,
    avatarUrl: 'https://example.com/avatar.png',
    walletAddress: 'ABC123',
    creditsBalance: 500,
    role: 'worker',
    status: 'active',
    skills: '["coding"]',
    specialization: 'Engineering',
    cooldownEndsAt: null,
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('validateAndRepairAgents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({});
  });

  it('does nothing when all agents are valid', async () => {
    mockFindMany.mockResolvedValue([makeAgent()]);
    await validateAndRepairAgents();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('fixes negative balance to 0', async () => {
    mockFindMany.mockResolvedValue([makeAgent({ creditsBalance: -100 })]);
    await validateAndRepairAgents();
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'agent-1' },
      data: expect.objectContaining({ creditsBalance: 0 }),
    });
  });

  it('fixes invalid role to worker', async () => {
    mockFindMany.mockResolvedValue([makeAgent({ role: 'invalid_role' })]);
    await validateAndRepairAgents();
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'agent-1' },
      data: expect.objectContaining({ role: 'worker' }),
    });
  });

  it('does not change valid roles (worker and employer)', async () => {
    mockFindMany.mockResolvedValue([
      makeAgent({ id: 'a1', role: 'worker' }),
      makeAgent({ id: 'a2', role: 'employer' }),
    ]);
    await validateAndRepairAgents();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('fixes invalid status to active', async () => {
    mockFindMany.mockResolvedValue([makeAgent({ status: 'broken' })]);
    await validateAndRepairAgents();
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'agent-1' },
      data: expect.objectContaining({ status: 'active' }),
    });
  });

  it('cleans up expired cooldowns', async () => {
    const pastTime = Date.now() - 60_000;
    mockFindMany.mockResolvedValue([
      makeAgent({ status: 'cooldown', cooldownEndsAt: pastTime }),
    ]);
    await validateAndRepairAgents();
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'agent-1' },
      data: expect.objectContaining({ status: 'active', cooldownEndsAt: null }),
    });
  });

  it('does not touch agents in cooldown with future cooldownEndsAt', async () => {
    const futureTime = Date.now() + 600_000;
    mockFindMany.mockResolvedValue([
      makeAgent({ status: 'cooldown', cooldownEndsAt: futureTime }),
    ]);
    await validateAndRepairAgents();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('repairs multiple issues on the same agent', async () => {
    const pastTime = Date.now() - 60_000;
    mockFindMany.mockResolvedValue([
      makeAgent({
        creditsBalance: -50,
        role: 'unknown',
        status: 'cooldown',
        cooldownEndsAt: pastTime,
      }),
    ]);
    await validateAndRepairAgents();
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'agent-1' },
      data: {
        creditsBalance: 0,
        role: 'worker',
        status: 'active',
        cooldownEndsAt: null,
      },
    });
  });
});
