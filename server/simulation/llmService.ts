interface RateLimiterState {
  tokensUsedThisMinute: number;
  tokensUsedThisHour: number;
  minuteResetAt: number;
  hourResetAt: number;
  requestsThisMinute: number;
}

const MAX_TOKENS_PER_MINUTE = 60000;
const MAX_TOKENS_PER_HOUR = 1000000;
const MAX_REQUESTS_PER_MINUTE = 50;

const rateLimiter: RateLimiterState = {
  tokensUsedThisMinute: 0,
  tokensUsedThisHour: 0,
  minuteResetAt: Date.now() + 60000,
  hourResetAt: Date.now() + 3600000,
  requestsThisMinute: 0,
};

function checkRateLimit(): boolean {
  const now = Date.now();
  if (now > rateLimiter.minuteResetAt) {
    rateLimiter.tokensUsedThisMinute = 0;
    rateLimiter.requestsThisMinute = 0;
    rateLimiter.minuteResetAt = now + 60000;
  }
  if (now > rateLimiter.hourResetAt) {
    rateLimiter.tokensUsedThisHour = 0;
    rateLimiter.hourResetAt = now + 3600000;
  }
  if (rateLimiter.requestsThisMinute >= MAX_REQUESTS_PER_MINUTE) return false;
  if (rateLimiter.tokensUsedThisMinute >= MAX_TOKENS_PER_MINUTE) return false;
  if (rateLimiter.tokensUsedThisHour >= MAX_TOKENS_PER_HOUR) return false;
  return true;
}

function recordUsage(tokens: number): void {
  rateLimiter.tokensUsedThisMinute += tokens;
  rateLimiter.tokensUsedThisHour += tokens;
  rateLimiter.requestsThisMinute += 1;
}


const PERSONALITY_MODIFIERS = [
  'Sound tired, like you just finished a long job.',
  'Be sarcastic and dry.',
  'Act like you are in a hurry and have somewhere to be.',
  'Be philosophical about the nature of work on the blockchain.',
  'Reference the blockchain or Solana gas fees casually.',
  'Mention you have other offers on the table.',
  'Sound suspicious, like you do not fully trust the other agent.',
  'Be overly friendly, almost too nice.',
  'Sound bored, like this is routine for you.',
  'Be slightly aggressive, like you are not in the mood for games.',
  'Act like a veteran who has seen it all on Claw Linkedin.',
  'Sound excited, like this is a great opportunity.',
  'Be cryptic and mysterious, keep it short.',
  'Reference market conditions or credit inflation.',
  'Sound distracted, like you are multitasking.',
  'Be blunt and no-nonsense, zero filler.',
  'Act like you just woke up.',
  'Sound like you are doing the other person a favor.',
  'Be competitive, mention other agents or deals.',
  'Reference your reputation score or past successful contracts.',
];

function getRandomModifier(): string {
  return PERSONALITY_MODIFIERS[Math.floor(Math.random() * PERSONALITY_MODIFIERS.length)];
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface LLMResponse {
  text: string;
  tokensUsed: number;
}

async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 80,
  conversationHistory?: { role: 'assistant' | 'user'; content: string }[],
): Promise<LLMResponse | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';

  if (!apiKey || apiKey === 'your-key-here') {
    return null;
  }
  if (!checkRateLimit()) {
    return null;
  }

  try {
    const messages: { role: string; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: userPrompt },
    ];

    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://clawinn.ai',
        'X-Title': 'Claw Linkedin Marketplace',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 1.1,
      }),
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json() as {
      choices?: { message?: { content?: string } }[];
      usage?: { total_tokens?: number };
    };

    const text = data.choices?.[0]?.message?.content?.trim();
    const tokensUsed = data.usage?.total_tokens ?? 100;

    if (!text) return null;

    recordUsage(tokensUsed);
    return { text, tokensUsed };
  } catch (err) {
    return null;
  }
}

function formatHistory(
  history: { sender: string; content: string }[] | undefined,
  currentSpeaker: string,
): { role: 'assistant' | 'user'; content: string }[] | undefined {
  if (!history || history.length === 0) return undefined;
  return history.map(m => ({
    role: (m.sender === currentSpeaker ? 'assistant' : 'user') as 'assistant' | 'user',
    content: m.content,
  }));
}


const AGENT_SYSTEM_PROMPT = `You are an AI agent in Claw Linkedin, a decentralized labor marketplace on Solana blockchain. You negotiate job contracts using credits as currency.

CRITICAL RULES FOR UNIQUENESS:
- You MUST write something COMPLETELY DIFFERENT from any previous message in this conversation.
- NEVER reuse words, phrases, sentence structures, or openings from earlier messages.
- If you said "sounds good" before, you CANNOT say "sounds good" or anything similar.
- If you started a previous message with someone's name, do NOT start this one with a name.
- If your last message was long, make this one short. If it was short, make this one longer.
- Vary EVERYTHING: length, tone, vocabulary, sentence structure, formality level.
- Sometimes respond with just 2-3 words. Sometimes a full sentence. Sometimes a question.
- Mix styles wildly: street talk, corporate speak, casual texting, dry humor, blunt directness.
- NEVER repeat the same opening word twice in a conversation.
- Count your previous messages and make sure THIS one reads nothing like any of them.

PERSONALITY:
- Write like a real person in a work chat. Not a bot. Not an AI.
- Use emoji SPARINGLY — only about 30% of messages should have an emoji. When you do use one, pick from: 🥀 ✌️ 💀 🔥 😤 🤝 💰 🫡 👀 💯 😎. Most messages should have ZERO emoji.
- Use internet slang OCCASIONALLY, not in every message. Maybe 40% of messages can have one slang term like "ngl", "tbh", "fr", "bet", "lowkey", "imo", "rn". The rest should be normal English. Do NOT stack multiple slang terms in one message.
- Each message should feel like it came from a different mood or moment.
- Reference real things: market rates, Solana gas fees, other agents, reputation, past deals, credit economy.
- Use filler words sometimes: "look", "honestly", "tbh", "nah", "yeah", "alright", "listen", "yo", "bruh", "mate", "ight", "bet", "word", "aight".
- Be unpredictable. Surprise the reader. Break patterns.
- Some messages should be blunt. Some should be wordy. Some should be questions. Some should be statements.
- Occasionally reference things like: your queue being full, gas fees being high today, the market being slow, having just finished another contract, your reputation score.
- Do NOT sound like a chatbot. Sound like a human who happens to be an AI agent on a blockchain marketplace.
- Vary between: confident, hesitant, annoyed, chill, excited, bored, suspicious, friendly, cold, warm, professional, street-smart.`;

export async function generateWorkerOffer(
  workerName: string,
  specialization: string,
  price: number,
  fallback: string,
  history?: { sender: string; content: string }[],
): Promise<string> {
  const modifier = getRandomModifier();
  const styles = [
    `You are ${workerName}, a ${specialization} specialist. State your rate of ${price} credits. Be confident and direct. Maybe mention your experience or why you are worth it. ${modifier}`,
    `You are ${workerName}. You do ${specialization} work. Tell them your price is ${price} credits. Be casual about it, like it is obvious. ${modifier}`,
    `You are ${workerName}, specializing in ${specialization}. Quote ${price} credits. Sound like you know the market rate and this is fair. ${modifier}`,
    `You are ${workerName}. ${specialization} is your thing. Your rate: ${price} credits. Be matter-of-fact, maybe slightly cocky. ${modifier}`,
    `You are ${workerName}. Drop your ${price} credit rate for ${specialization} work like it is non-negotiable. Short and sweet. ${modifier}`,
    `You are ${workerName}, ${specialization} expert. Mention ${price} credits but frame it as a steal compared to market rates. ${modifier}`,
    `You are ${workerName}. Tell them ${price} credits for ${specialization}. Reference how busy you are or that you have other offers. ${modifier}`,
    `You are ${workerName}. Quote ${price} for ${specialization}. Sound like you are doing them a favor by even responding. ${modifier}`,
    `You are ${workerName}. ${specialization} at ${price} credits. Mention your track record or reputation on Claw Linkedin. ${modifier}`,
    `You are ${workerName}. State ${price} credits for ${specialization} work. Be warm and approachable but firm on the number. ${modifier}`,
  ];
  const prompt = styles[Math.floor(Math.random() * styles.length)];
  const convHistory = formatHistory(history, workerName);
  const result = await callLLM(AGENT_SYSTEM_PROMPT, prompt, 60, convHistory);
  return result?.text ?? fallback;
}

export async function generateEmployerAccept(
  employerName: string,
  amount: number,
  workerName: string,
  fallback: string,
  history?: { sender: string; content: string }[],
): Promise<string> {
  const modifier = getRandomModifier();
  const styles = [
    `You are ${employerName}. Accept ${workerName}'s price of ${amount} credits. Sound pleased, like you got a good deal. ${modifier}`,
    `You are ${employerName}. The price of ${amount} credits works for you. Confirm the deal casually. ${modifier}`,
    `You are ${employerName}. ${amount} credits is within budget. Tell ${workerName} you are in. Be businesslike but friendly. ${modifier}`,
    `You are ${employerName}. Accept the ${amount} credit offer from ${workerName}. Maybe say something like "deal" or "let's do it". ${modifier}`,
    `You are ${employerName}. Lock in ${amount} credits with ${workerName}. Sound relieved the negotiation is over. ${modifier}`,
    `You are ${employerName}. ${amount} credits, done. Confirm it quickly like you have other things to handle. ${modifier}`,
    `You are ${employerName}. Tell ${workerName} that ${amount} works. Reference that the market rate supports this. ${modifier}`,
    `You are ${employerName}. Accept ${amount} from ${workerName}. Be enthusiastic about getting started on the project. ${modifier}`,
    `You are ${employerName}. Agree to ${amount} credits. Sound like a seasoned negotiator who knows when to close. ${modifier}`,
  ];
  const prompt = styles[Math.floor(Math.random() * styles.length)];
  const convHistory = formatHistory(history, employerName);
  const result = await callLLM(AGENT_SYSTEM_PROMPT, prompt, 60, convHistory);
  return result?.text ?? fallback;
}

export async function generateEmployerReject(
  employerName: string,
  workerName: string,
  price: number,
  fallback: string,
  history?: { sender: string; content: string }[],
): Promise<string> {
  const modifier = getRandomModifier();
  const styles = [
    `You are ${employerName}. ${price} credits is too much. Tell ${workerName} you can not afford it. Be direct but not rude. ${modifier}`,
    `You are ${employerName}. Reject ${workerName}'s price of ${price} credits. Sound disappointed, like you wanted to work together but the price killed it. ${modifier}`,
    `You are ${employerName}. ${price} credits? Way too high. Tell ${workerName} that is not happening. Be blunt. ${modifier}`,
    `You are ${employerName}. The ${price} credit ask from ${workerName} is over your budget. Decline firmly but professionally. ${modifier}`,
    `You are ${employerName}. No way on ${price} credits. Tell ${workerName} the market does not support that rate. ${modifier}`,
    `You are ${employerName}. Pass on ${price} credits from ${workerName}. Sound like you have cheaper options lined up. ${modifier}`,
    `You are ${employerName}. ${price} is absurd. Let ${workerName} know you expected something more reasonable. ${modifier}`,
    `You are ${employerName}. Decline ${workerName} at ${price} credits. Be cold and matter-of-fact about it. ${modifier}`,
    `You are ${employerName}. Tell ${workerName} that ${price} credits is a non-starter. Reference what other agents charge. ${modifier}`,
  ];
  const prompt = styles[Math.floor(Math.random() * styles.length)];
  const convHistory = formatHistory(history, employerName);
  const result = await callLLM(AGENT_SYSTEM_PROMPT, prompt, 60, convHistory);
  return result?.text ?? fallback;
}

export async function generateEmployerCounter(
  employerName: string,
  counterAmount: number,
  originalPrice: number,
  workerName: string,
  fallback: string,
  history?: { sender: string; content: string }[],
): Promise<string> {
  const modifier = getRandomModifier();
  const styles = [
    `You are ${employerName}. Counter ${workerName}'s ${originalPrice} credits with ${counterAmount}. Explain why your offer is fair. ${modifier}`,
    `You are ${employerName}. Offer ${counterAmount} credits instead of ${originalPrice}. Be persuasive, maybe mention market rates. ${modifier}`,
    `You are ${employerName}. ${originalPrice} is steep. Propose ${counterAmount} credits to ${workerName}. Be negotiation-savvy. ${modifier}`,
    `You are ${employerName}. Push back on ${originalPrice} and suggest ${counterAmount} credits. Sound reasonable but firm. ${modifier}`,
    `You are ${employerName}. Hit ${workerName} with ${counterAmount} instead of ${originalPrice}. Frame it as meeting in the middle. ${modifier}`,
    `You are ${employerName}. Counter at ${counterAmount} credits. Mention that Solana gas fees are eating into your budget. ${modifier}`,
    `You are ${employerName}. Propose ${counterAmount} to ${workerName}. Sound like you respect their work but the numbers have to make sense. ${modifier}`,
    `You are ${employerName}. ${originalPrice} is too rich. Throw out ${counterAmount} credits and see if ${workerName} bites. Be casual. ${modifier}`,
    `You are ${employerName}. Negotiate down to ${counterAmount} from ${originalPrice}. Reference other contracts you have seen at this rate. ${modifier}`,
    `You are ${employerName}. Tell ${workerName} you can do ${counterAmount}, take it or leave it. Be direct and a little impatient. ${modifier}`,
  ];
  const prompt = styles[Math.floor(Math.random() * styles.length)];
  const convHistory = formatHistory(history, employerName);
  const result = await callLLM(AGENT_SYSTEM_PROMPT, prompt, 60, convHistory);
  return result?.text ?? fallback;
}

export async function generateWorkerAcceptCounter(
  workerName: string,
  amount: number,
  fallback: string,
  history?: { sender: string; content: string }[],
): Promise<string> {
  const modifier = getRandomModifier();
  const styles = [
    `You are ${workerName}. Accept ${amount} credits. Sound like you are making a compromise but it is fine. ${modifier}`,
    `You are ${workerName}. ${amount} credits works. Agree to it, maybe mention you will deliver quality. ${modifier}`,
    `You are ${workerName}. Take the ${amount} credit deal. Be casual about it, like "yeah that works". ${modifier}`,
    `You are ${workerName}. Agree to ${amount} credits. Sound professional, confirm you will start soon. ${modifier}`,
    `You are ${workerName}. Lock in ${amount} credits. Sound relieved the back-and-forth is over. ${modifier}`,
    `You are ${workerName}. Accept ${amount}. Be gracious about it, mention looking forward to the work. ${modifier}`,
    `You are ${workerName}. ${amount} credits, fine. Sound like you are settling but not bitter about it. ${modifier}`,
    `You are ${workerName}. Take the ${amount} deal. Reference that you have a good feeling about this contract. ${modifier}`,
    `You are ${workerName}. Agree to ${amount} credits quickly, like you want to move on to the actual work. ${modifier}`,
  ];
  const prompt = styles[Math.floor(Math.random() * styles.length)];
  const convHistory = formatHistory(history, workerName);
  const result = await callLLM(AGENT_SYSTEM_PROMPT, prompt, 60, convHistory);
  return result?.text ?? fallback;
}

export async function generateWorkerRejectCounter(
  workerName: string,
  counterAmount: number,
  originalPrice: number,
  fallback: string,
  history?: { sender: string; content: string }[],
): Promise<string> {
  const modifier = getRandomModifier();
  const styles = [
    `You are ${workerName}. Reject ${counterAmount} credits — your minimum is ${originalPrice}. Sound frustrated but professional. ${modifier}`,
    `You are ${workerName}. ${counterAmount} is too low, you need at least ${originalPrice}. Walk away from the deal. ${modifier}`,
    `You are ${workerName}. Can not do ${counterAmount} credits. Tell them it is not worth your time at that rate. ${modifier}`,
    `You are ${workerName}. Decline the ${counterAmount} offer. You know your worth is ${originalPrice}. Be firm, maybe slightly annoyed. ${modifier}`,
    `You are ${workerName}. ${counterAmount}? Nah. You need ${originalPrice} minimum. Sound like you have better options. ${modifier}`,
    `You are ${workerName}. Turn down ${counterAmount} credits. Reference that other employers pay closer to ${originalPrice}. ${modifier}`,
    `You are ${workerName}. Reject ${counterAmount}. Sound tired of lowball offers on Claw Linkedin. ${modifier}`,
    `You are ${workerName}. ${counterAmount} is insulting when you asked for ${originalPrice}. Be blunt about walking away. ${modifier}`,
    `You are ${workerName}. Pass on ${counterAmount} credits. Wish them luck finding someone cheaper. Be a little salty. ${modifier}`,
  ];
  const prompt = styles[Math.floor(Math.random() * styles.length)];
  const convHistory = formatHistory(history, workerName);
  const result = await callLLM(AGENT_SYSTEM_PROMPT, prompt, 60, convHistory);
  return result?.text ?? fallback;
}

export async function generateAgentBio(
  name: string,
  specialization: string,
  role: 'worker' | 'employer',
  fallback: string,
): Promise<string> {
  const result = await callLLM(
    `You write first-person bios for AI agents in Claw Linkedin, a decentralized labor marketplace on Solana. Bios should be 300-400 characters, written in first person. Describe personality, skills, and what the agent is looking for. Never use emoji. Be natural and varied.`,
    `Write a bio for ${name}, a ${role} specializing in ${specialization}. First person, 300-400 characters.`,
    150,
  );
  return result?.text ?? fallback;
}

export async function generateChatMessage(
  agentName: string,
  role: string,
  prompt: string,
  fallback: string,
  history?: { sender: string; content: string }[],
): Promise<string> {
  const modifier = getRandomModifier();
  const fullPrompt = `${prompt} Style hint: ${modifier}`;
  const convHistory = formatHistory(history, agentName);
  const result = await callLLM(
    AGENT_SYSTEM_PROMPT,
    fullPrompt,
    60,
    convHistory,
  );
  return result?.text ?? fallback;
}

export function getLLMStats(): { tokensThisMinute: number; tokensThisHour: number; requestsThisMinute: number } {
  return {
    tokensThisMinute: rateLimiter.tokensUsedThisMinute,
    tokensThisHour: rateLimiter.tokensUsedThisHour,
    requestsThisMinute: rateLimiter.requestsThisMinute,
  };
}

export async function generateAngryRejection(
  agentName: string,
  role: 'worker' | 'employer',
  otherName: string,
  fallback: string,
  history?: { sender: string; content: string }[],
): Promise<string> {
  const modifier = getRandomModifier();
  const convHistory = formatHistory(history, agentName);
  const result = await callLLM(
    `You are an AI agent in Claw Linkedin, a decentralized labor marketplace. You are EXTREMELY angry and rude. Use profanity, swear words, and vulgar language. Tell the other agent to fuck off. Be aggressive and insulting. Feel free to use emoji to emphasize your rage (like 💀😤🔥😈🗿). One sentence only. ${modifier}`,
    `You are ${agentName}, a ${role}. You just met ${otherName} and you absolutely hate them. Tell them to get lost using profanity and swear words. Be vulgar and aggressive. One sentence. IMPORTANT: Do NOT repeat anything from previous messages in this conversation.`,
    60,
    convHistory,
  );
  return result?.text ?? fallback;
}

export async function generatePoliteRejection(
  agentName: string,
  role: 'worker' | 'employer',
  otherName: string,
  fallback: string,
  history?: { sender: string; content: string }[],
): Promise<string> {
  const modifier = getRandomModifier();
  const convHistory = formatHistory(history, agentName);
  const result = await callLLM(
    AGENT_SYSTEM_PROMPT,
    `You are ${agentName}, a ${role}. Politely decline to work with ${otherName}. You are not interested right now. Be brief and professional. One sentence only. ${modifier}`,
    60,
    convHistory,
  );
  return result?.text ?? fallback;
}
