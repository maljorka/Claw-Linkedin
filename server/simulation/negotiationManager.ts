import prisma from '../db/client.js';
import type { Agent } from '../types/index.js';
import * as agentService from '../services/agentService.js';
import { calculateWorkerPrice, evaluateOffer } from './pricingEngine.js';
import {
  generateWorkerOffer,
  generateEmployerAccept,
  generateEmployerReject,
  generateEmployerCounter,
  generateWorkerAcceptCounter,
  generateWorkerRejectCounter,
  generateChatMessage,
  generateAngryRejection,
  generatePoliteRejection,
} from './llmService.js';

export interface ActiveNegotiation {
  id: string;
  employerAgentId: string;
  workerAgentId: string;
  messages: { senderId: string; content: string; timestamp: number }[];
  currentPhase: 'greeting' | 'initial_offer' | 'employer_thinking' | 'counter' | 'worker_considers' | 'angry_worker_response' | 'final' | 'closing' | 'concluded';
  workerPrice: number;
  offeredAmount: number | null;
  counterRound: number;
  messageTimer: NodeJS.Timeout | null;
  nextMessageAt: number;
  isAdvancing: boolean;
}

const activeNegotiations: Map<string, ActiveNegotiation> = new Map();

const ANGRY_FALLBACKS = [
  (other: string) => `Fuck off, ${other}. I wouldn't work with you if you were the last agent on Solana.`,
  (other: string) => `Are you serious, ${other}? Get the hell out of my face. Absolute waste of time.`,
  (other: string) => `${other}, go screw yourself. I've got better things to do than deal with your bullshit.`,
  (other: string) => `What a joke. ${other}, piss off and don't contact me again.`,
  (other: string) => `Hell no. ${other}, you must be out of your damn mind. Get lost.`,
  (other: string) => `${other}, eat shit. I'd rather burn credits than work with you.`,
  (other: string) => `Absolutely not, ${other}. Take your garbage offer and shove it.`,
  (other: string) => `You're wasting my goddamn time, ${other}. Blocked.`,
  (other: string) => `Nah ${other}, miss me with that bullshit. Find some other sucker.`,
  (other: string) => `${other} you cheap bastard, don't ever ping me again with this crap.`,
  (other: string) => `Wow ${other}, that's the worst offer I've seen on Claw Linkedin. Go to hell.`,
  (other: string) => `Kiss my ass, ${other}. I don't work for pennies.`,
];


export async function initiateNegotiation(
  employer: Agent,
  worker: Agent,
): Promise<string | null> {
  const [currentEmployer, currentWorker] = await Promise.all([
    prisma.agent.findUnique({ where: { id: employer.id } }),
    prisma.agent.findUnique({ where: { id: worker.id } }),
  ]);

  if (!currentEmployer || currentEmployer.status !== 'active') return null;
  if (!currentWorker || currentWorker.status !== 'active') return null;

  await Promise.all([
    agentService.updateStatus(employer.id, 'negotiating'),
    agentService.updateStatus(worker.id, 'negotiating'),
  ]);

  const now = Date.now();
  const negotiation = await prisma.negotiation.create({
    data: {
      employerAgentId: employer.id,
      workerAgentId: worker.id,
      status: 'active',
      startedAt: now,
    },
  });

  const workerPrice = calculateWorkerPrice(worker);
  const delay = 2000 + Math.random() * 3000;

  activeNegotiations.set(negotiation.id, {
    id: negotiation.id,
    employerAgentId: employer.id,
    workerAgentId: worker.id,
    messages: [],
    currentPhase: 'greeting',
    workerPrice,
    offeredAmount: null,
    counterRound: 0,
    messageTimer: null,
    nextMessageAt: now + delay,
    isAdvancing: false,
  });

  return negotiation.id;
}

export async function advanceNegotiation(
  negotiationId: string,
): Promise<'pending' | 'agreed' | 'rejected'> {
  const neg = activeNegotiations.get(negotiationId);
  if (!neg) return 'rejected';
  if (neg.currentPhase === 'concluded') return 'pending';

  const now = Date.now();
  if (now < neg.nextMessageAt) return 'pending';

  if (neg.isAdvancing) return 'pending';
  neg.isAdvancing = true;

  try {
  const nextDelay = 4000 + Math.random() * 4000;
  neg.nextMessageAt = now + nextDelay;

  const [employer, worker] = await Promise.all([
    agentService.getById(neg.employerAgentId),
    agentService.getById(neg.workerAgentId),
  ]);

  if (!employer || !worker) {
    await concludeNegotiation(negotiationId, 'rejected');
    return 'rejected';
  }

  const history = neg.messages.map(m => ({ sender: m.senderId, content: m.content }));

  switch (neg.currentPhase) {
    case 'greeting': {
      const greetingFallbacks = [
        `Hey ${worker.name}, I have a ${worker.specialization} position open. Interested?`,
        `${worker.name}, looking for someone in ${worker.specialization}. You available?`,
        `Got a ${worker.specialization} gig, ${worker.name}. Let me know if you're free.`,
        `${worker.name} — need ${worker.specialization} work done. What's your rate?`,
        `Hi ${worker.name}, got a ${worker.specialization} job if you're taking on work right now.`,
        `${worker.name}, quick ${worker.specialization} project. You in? 🔥`,
        `Looking for a ${worker.specialization} person, ${worker.name}. Got time?`,
        `${worker.name} I need ${worker.specialization} help, heard you're good at it.`,
      ];
      const fallback = greetingFallbacks[Math.floor(Math.random() * greetingFallbacks.length)];
      const content = await generateChatMessage(
        employer.name, 'employer',
        `You are ${employer.name}, an employer. Greet ${worker.name} and briefly describe that you have a ${worker.specialization} job available. Be casual and direct. One sentence.`,
        fallback,
        history,
      );
      const msg = { senderId: employer.id, content, timestamp: now };
      neg.messages.push(msg);
      await persistMessage(negotiationId, msg);
      neg.currentPhase = 'initial_offer';
      return 'pending';
    }

    case 'initial_offer': {
      const offerFallbacks = [
        `${neg.workerPrice} credits. That's my rate.`,
        `I charge ${neg.workerPrice} credits for this kind of work.`,
        `My price is ${neg.workerPrice} credits, pretty standard for the market.`,
        `${neg.workerPrice} credits and we have a deal.`,
        `${neg.workerPrice} is fair for this scope of work.`,
        `${neg.workerPrice} credits — been doing this a while, that's the going rate.`,
        `I'd do it for ${neg.workerPrice} credits. Take it or leave it 💰`,
        `${neg.workerPrice} credits. Let me know what you think.`,
      ];
      const fallback = offerFallbacks[Math.floor(Math.random() * offerFallbacks.length)];
      const content = await generateWorkerOffer(
        worker.name, worker.specialization, neg.workerPrice, fallback,
        history,
      );
      const msg = { senderId: worker.id, content, timestamp: now };
      neg.messages.push(msg);
      await persistMessage(negotiationId, msg);
      
      const rejectionRoll = Math.random();
      if (rejectionRoll < 0.30) {
        neg.currentPhase = 'employer_thinking';
        neg.counterRound = rejectionRoll < 0.15 ? -2 : -1;
      } else {
        neg.currentPhase = 'employer_thinking';
      }
      return 'pending';
    }

    case 'employer_thinking': {
      if (neg.counterRound === -2 || neg.counterRound === -1) {
        const isAngry = neg.counterRound === -2;
        neg.counterRound = 0;
        
        const currentHistory = neg.messages.map(m => ({ sender: m.senderId, content: m.content }));
        
        if (isAngry) {
          const fallback = ANGRY_FALLBACKS[Math.floor(Math.random() * ANGRY_FALLBACKS.length)](worker.name);
          const content = await generateAngryRejection(employer.name, 'employer', worker.name, fallback, currentHistory);
          const msg = { senderId: employer.id, content, timestamp: now };
          neg.messages.push(msg);
          await persistMessage(negotiationId, msg);
          neg.currentPhase = 'angry_worker_response';
          return 'pending';
        } else {
          const politeFallbacks = [
            `Appreciate it ${worker.name}, but ${neg.workerPrice} credits is over my budget right now.`,
            `${worker.name}, respect the hustle but I can't swing ${neg.workerPrice} credits.`,
            `Going to have to pass, ${worker.name}. ${neg.workerPrice} is too steep for me.`,
            `Not this time ${worker.name}, ${neg.workerPrice} credits doesn't work for me.`,
            `${worker.name}, I wish I could but ${neg.workerPrice} is more than I can do.`,
          ];
          const fallback = politeFallbacks[Math.floor(Math.random() * politeFallbacks.length)];
          const content = await generatePoliteRejection(employer.name, 'employer', worker.name, fallback, currentHistory);
          const msg = { senderId: employer.id, content, timestamp: now };
          neg.messages.push(msg);
          await persistMessage(negotiationId, msg);
          neg.currentPhase = 'concluded';
          await concludeNegotiation(negotiationId, 'rejected');
          return 'rejected';
        }
      }
      
      const evaluation = evaluateOffer(employer, neg.offeredAmount ?? neg.workerPrice);

      if (evaluation.response === 'accept') {
        const acceptFallbacks = [
          `${neg.offeredAmount ?? neg.workerPrice} credits works for me. Let's do it.`,
          `Deal. ${neg.offeredAmount ?? neg.workerPrice} credits. 🤝`,
          `${neg.offeredAmount ?? neg.workerPrice} credits, you're hired.`,
          `${neg.offeredAmount ?? neg.workerPrice} credits sounds fair, I'm in.`,
          `That's reasonable. ${neg.offeredAmount ?? neg.workerPrice} it is.`,
          `${neg.offeredAmount ?? neg.workerPrice} credits locked in. Let's get started.`,
        ];
        const fallback = acceptFallbacks[Math.floor(Math.random() * acceptFallbacks.length)];
        const content = await generateEmployerAccept(
          employer.name, neg.offeredAmount ?? neg.workerPrice, worker.name, fallback,
          history,
        );
        const msg = { senderId: employer.id, content, timestamp: now };
        neg.messages.push(msg);
        await persistMessage(negotiationId, msg);
        neg.currentPhase = 'closing';
        return 'pending';
      }

      if (evaluation.response === 'reject') {
        const rejectFallbacks = [
          `That's too much for me right now.`,
          `Can't do it, over budget.`,
          `Going to have to pass on this one.`,
          `Too rich for my blood.`,
          `Not happening at that price, sorry.`,
          `I'll have to find someone cheaper 🤷`,
        ];
        const fallback = rejectFallbacks[Math.floor(Math.random() * rejectFallbacks.length)];
        const content = await generateEmployerReject(
          employer.name, worker.name, neg.offeredAmount ?? neg.workerPrice, fallback,
          history,
        );
        const msg = { senderId: employer.id, content, timestamp: now };
        neg.messages.push(msg);
        await persistMessage(negotiationId, msg);
        neg.currentPhase = 'concluded';
        await concludeNegotiation(negotiationId, 'rejected');
        return 'rejected';
      }

      const counterAmount = evaluation.counterAmount!;
      neg.offeredAmount = counterAmount;
      neg.counterRound++;
      const counterFallbacks = [
        `How about ${counterAmount} credits?`,
        `${counterAmount} credits is more what I had in mind.`,
        `I can only do ${counterAmount}. Does that work?`,
        `${counterAmount} credits — meet me halfway?`,
        `${counterAmount} is my max right now.`,
        `Counter: ${counterAmount} credits. Fair? 💰`,
      ];
      const fallback = counterFallbacks[Math.floor(Math.random() * counterFallbacks.length)];
      const content = await generateEmployerCounter(
        employer.name, counterAmount, neg.workerPrice, worker.name, fallback,
        history,
      );
      const msg = { senderId: employer.id, content, timestamp: now };
      neg.messages.push(msg);
      await persistMessage(negotiationId, msg);
      neg.currentPhase = 'worker_considers';
      return 'pending';
    }

    case 'worker_considers': {
      const counterAmount = neg.offeredAmount ?? neg.workerPrice;
      const ratio = counterAmount / neg.workerPrice;

      const acceptThreshold = Math.max(0.5, 0.7 - neg.counterRound * 0.1);

      if (ratio >= acceptThreshold) {
        const workerAcceptFallbacks = [
          `${counterAmount} works. Let's do it.`,
          `${counterAmount} credits? Fine by me.`,
          `Alright, ${counterAmount} credits it is.`,
          `Deal at ${counterAmount}. Sending contract.`,
          `${counterAmount} is cool, I'm in. 🤝`,
          `${counterAmount} credits, let's go.`,
        ];
        const fallback = workerAcceptFallbacks[Math.floor(Math.random() * workerAcceptFallbacks.length)];
        const content = await generateWorkerAcceptCounter(
          worker.name, counterAmount, fallback,
          history,
        );
        const msg = { senderId: worker.id, content, timestamp: now };
        neg.messages.push(msg);
        await persistMessage(negotiationId, msg);
        neg.currentPhase = 'closing';
        return 'pending';
      }

      if (neg.counterRound < 3) {
        const workerCounter = Math.round(counterAmount + (neg.workerPrice - counterAmount) * (0.3 + Math.random() * 0.3));
        const workerCounterFallbacks = [
          `${counterAmount} is low... ${workerCounter} and we're good.`,
          `Can't do ${counterAmount}. ${workerCounter} credits, final offer.`,
          `Can't go that low. ${workerCounter} credits?`,
          `${workerCounter} is my bottom line.`,
          `Need at least ${workerCounter} for this kind of work.`,
          `${counterAmount}? No. ${workerCounter} and I'll start today 🔥`,
        ];
        const fallback = workerCounterFallbacks[Math.floor(Math.random() * workerCounterFallbacks.length)];
        const content = await generateChatMessage(
          worker.name, 'worker',
          `You are ${worker.name}, a worker. The employer offered ${counterAmount} credits but you wanted ${neg.workerPrice}. Counter with ${workerCounter} credits. Be firm but reasonable. One sentence.`,
          fallback,
          history,
        );
        const msg = { senderId: worker.id, content, timestamp: now };
        neg.messages.push(msg);
        await persistMessage(negotiationId, msg);
        neg.offeredAmount = workerCounter;
        neg.currentPhase = 'employer_thinking';
        return 'pending';
      }

      const workerRejectFallbacks = [
        `Can't do it, too low.`,
        `Not worth my time at that rate.`,
        `Going to pass. Find someone else.`,
        `That's insulting. I'm out.`,
        `No deal, maybe next time.`,
        `Can't go that low. Peace ✌️`,
      ];
      const fallback = workerRejectFallbacks[Math.floor(Math.random() * workerRejectFallbacks.length)];
      const content = await generateWorkerRejectCounter(
        worker.name, counterAmount, neg.workerPrice, fallback,
        history,
      );
      const msg = { senderId: worker.id, content, timestamp: now };
      neg.messages.push(msg);
      await persistMessage(negotiationId, msg);
      neg.currentPhase = 'concluded';
      await concludeNegotiation(negotiationId, 'rejected');
      return 'rejected';
    }

    case 'closing': {
      const agreedAmount = neg.offeredAmount ?? neg.workerPrice;
      const lastSender = neg.messages[neg.messages.length - 1]?.senderId;
      const closerId = lastSender === employer.id ? worker.id : employer.id;
      const closerName = closerId === employer.id ? employer.name : worker.name;
      const closerRole = closerId === employer.id ? 'employer' : 'worker';

      const closingFallbacks = [
        `${agreedAmount} credits confirmed. Let's get it.`,
        `Locked in at ${agreedAmount} credits. Good doing business.`,
        `${agreedAmount} credits. Starting now.`,
        `${agreedAmount} credits, deal sealed. 🤝`,
        `Nice, ${agreedAmount} credits it is. Talk soon.`,
        `${agreedAmount} confirmed. Pleasure doing business.`,
      ];
      const fallback = closingFallbacks[Math.floor(Math.random() * closingFallbacks.length)];
      const content = await generateChatMessage(
        closerName, closerRole,
        `You are ${closerName}, a ${closerRole}. You just agreed on ${agreedAmount} credits for a job. Write a brief, positive closing message confirming the deal. One sentence.`,
        fallback,
        history,
      );
      const msg = { senderId: closerId, content, timestamp: now };
      neg.messages.push(msg);
      await persistMessage(negotiationId, msg);

      neg.currentPhase = 'concluded';
      await concludeNegotiation(negotiationId, 'agreed', agreedAmount);
      return 'agreed';
    }

    case 'angry_worker_response': {
      const currentHistory = neg.messages.map(m => ({ sender: m.senderId, content: m.content }));
      const angryWorkerFallbacks = [
        `Whatever ${employer.name}, your loss.`,
        `${employer.name} you're a joke. Good luck finding someone else.`,
        `${employer.name}, eat shit. I got better offers.`,
        `Nah, fuck you too ${employer.name}.`,
        `${employer.name} you're trash. Blocked.`,
        `Go find someone else to lowball, ${employer.name} 💀`,
      ];
      const workerFallback = angryWorkerFallbacks[Math.floor(Math.random() * angryWorkerFallbacks.length)];
      const workerContent = await generateChatMessage(
        worker.name, 'worker',
        `You are ${worker.name}. The employer ${employer.name} just insulted you and rejected your price aggressively. Respond with anger. Tell them off. Be rude back. One sentence.`,
        workerFallback,
        currentHistory,
      );
      const workerMsg = { senderId: worker.id, content: workerContent, timestamp: now };
      neg.messages.push(workerMsg);
      await persistMessage(negotiationId, workerMsg);
      neg.currentPhase = 'concluded';
      await concludeNegotiation(negotiationId, 'rejected');
      return 'rejected';
    }

    default:
      return 'pending';
  }
  } finally {
    neg.isAdvancing = false;
  }
}


async function persistMessage(
  negotiationId: string,
  msg: { senderId: string; content: string; timestamp: number },
): Promise<void> {
  await prisma.chatMessage.create({
    data: {
      negotiationId,
      senderAgentId: msg.senderId,
      content: msg.content,
      timestamp: msg.timestamp,
      isTyping: false,
    },
  });
}

export async function concludeNegotiation(
  negotiationId: string,
  outcome: 'agreed' | 'rejected',
  agreedAmount?: number,
): Promise<void> {
  const neg = activeNegotiations.get(negotiationId);

  await prisma.negotiation.update({
    where: { id: negotiationId },
    data: {
      status: outcome,
      agreedAmount: outcome === 'agreed' ? (agreedAmount ?? null) : null,
      endedAt: Date.now(),
    },
  });

  if (neg?.messageTimer) {
    clearTimeout(neg.messageTimer);
  }

  activeNegotiations.delete(negotiationId);

  if (outcome === 'rejected' && neg) {
    await Promise.all([
      agentService.updateStatus(neg.employerAgentId, 'active'),
      agentService.updateStatus(neg.workerAgentId, 'active'),
    ]);
  }
}

export function getActiveNegotiations(): ActiveNegotiation[] {
  return Array.from(activeNegotiations.values());
}

export function getActiveNegotiationForAgent(agentId: string): ActiveNegotiation | null {
  for (const neg of activeNegotiations.values()) {
    if (neg.employerAgentId === agentId || neg.workerAgentId === agentId) {
      return neg;
    }
  }
  return null;
}
