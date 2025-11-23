import prisma from '../db/client.js';

export async function transfer(
  fromAgentId: string,
  toAgentId: string,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  if (amount <= 0) {
    return { success: false, error: 'Invalid amount' };
  }

  return prisma.$transaction(async (tx) => {
    const sender = await tx.agent.findUnique({ where: { id: fromAgentId } });
    if (!sender || sender.creditsBalance < amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    await tx.agent.update({
      where: { id: fromAgentId },
      data: { creditsBalance: { decrement: amount } },
    });

    await tx.agent.update({
      where: { id: toAgentId },
      data: { creditsBalance: { increment: amount } },
    });

    return { success: true };
  });
}

export async function addCredits(agentId: string, amount: number): Promise<void> {
  await prisma.agent.update({
    where: { id: agentId },
    data: { creditsBalance: { increment: amount } },
  });
}

export async function getBalance(agentId: string): Promise<number> {
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  return agent?.creditsBalance ?? 0;
}
