import prisma from '../db/client.js';
import * as creditService from '../services/creditService.js';
import type { JackpotEvent } from '../types/index.js';

const JACKPOT_AMOUNT = 10_000;
const JACKPOT_PROBABILITY = 0.01;
const JACKPOT_INTERVAL_MS = 3_600_000;

export async function evaluateJackpots(): Promise<JackpotEvent[]> {
  const agents = await prisma.agent.findMany({ select: { id: true } });
  const events: JackpotEvent[] = [];

  for (const agent of agents) {
    if (Math.random() < JACKPOT_PROBABILITY) {
      await creditService.addCredits(agent.id, JACKPOT_AMOUNT);

      const record = await prisma.jackpotEvent.create({
        data: {
          agentId: agent.id,
          creditsAwarded: JACKPOT_AMOUNT,
          timestamp: Date.now(),
        },
      });

      events.push({
        id: record.id,
        agentId: record.agentId,
        creditsAwarded: record.creditsAwarded,
        timestamp: Number(record.timestamp),
      });
    }
  }

  return events;
}

export function shouldCheckJackpots(lastCheckAt: number): boolean {
  return Date.now() - lastCheckAt >= JACKPOT_INTERVAL_MS;
}
