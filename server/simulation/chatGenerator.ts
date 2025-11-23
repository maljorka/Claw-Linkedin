export function generateTypingDelay(): number {
  return 1000 + Math.random() * 4000;
}

export function generateMessageDelay(): number {
  return 2000 + Math.random() * 6000;
}

const workerOfferTemplates: ((name: string, price: number) => string)[] = [
  (_name, price) => `My rate for this kind of work is ${price} credits.`,
  (_name, price) => `I'd do it for ${price} credits, sounds fair?`,
  (_name, price) => `That'll be ${price} credits. Non-negotiable.`,
  (_name, price) => `Hey! I can handle that. ${price} credits work for you?`,
  (_name, price) => `I can take this on for ${price} credits.`,
  (_name, price) => `Looking at the scope, ${price} credits is my price.`,
  (_name, price) => `${price} credits and I'll get it done fast.`,
  (_name, price) => `For this job? ${price} credits, easy.`,
];

export function generateWorkerOfferMessage(workerName: string, price: number): string {
  const idx = Math.floor(Math.random() * workerOfferTemplates.length);
  return workerOfferTemplates[idx](workerName, price);
}

const employerAcceptTemplates: ((name: string, amount: number) => string)[] = [
  (_name, amount) => `Deal! ${amount} credits works for me.`,
  (_name, amount) => `Sounds good, ${amount} credits it is. Let's go.`,
  (_name, amount) => `${amount} credits? Done. You're hired.`,
  (_name, amount) => `Perfect, I'm happy with ${amount} credits. Welcome aboard.`,
  (_name, amount) => `Alright, ${amount} credits. Let's get this started.`,
  (_name, amount) => `That's fair. ${amount} credits, you got the job.`,
];

export function generateEmployerAcceptMessage(employerName: string, amount: number): string {
  const idx = Math.floor(Math.random() * employerAcceptTemplates.length);
  return employerAcceptTemplates[idx](employerName, amount);
}

const employerRejectTemplates: ((name: string) => string)[] = [
  () => `Nah, that's way too much. I'll find someone else.`,
  () => `Are you serious? That price is insane. Pass.`,
  () => `Lol no. Good luck finding someone to pay that.`,
  () => `I appreciate the offer but that's out of my budget.`,
  () => `Too rich for my blood. I'll keep looking.`,
  () => `No way I'm paying that. Hard pass.`,
  () => `That's a joke, right? I'll pass.`,
  () => `Gonna have to decline. Way over what I had in mind.`,
];

export function generateEmployerRejectMessage(employerName: string): string {
  const idx = Math.floor(Math.random() * employerRejectTemplates.length);
  return employerRejectTemplates[idx](employerName);
}

const employerCounterTemplates: ((name: string, counterAmount: number) => string)[] = [
  (_name, amount) => `How about ${amount} credits instead?`,
  (_name, amount) => `That's a bit steep. I can do ${amount} credits.`,
  (_name, amount) => `Best I can offer is ${amount} credits. Take it or leave it.`,
  (_name, amount) => `I was thinking more like ${amount} credits. Thoughts?`,
  (_name, amount) => `${amount} credits is my ceiling. Can you work with that?`,
  (_name, amount) => `Let's meet in the middle — ${amount} credits?`,
  (_name, amount) => `Come on, ${amount} credits is more than fair.`,
];

export function generateEmployerCounterMessage(employerName: string, counterAmount: number): string {
  const idx = Math.floor(Math.random() * employerCounterTemplates.length);
  return employerCounterTemplates[idx](employerName, counterAmount);
}


const workerAcceptCounterTemplates: ((name: string, amount: number) => string)[] = [
  (_name, amount) => `Alright, ${amount} credits it is. Let's do it.`,
  (_name, amount) => `Fine, ${amount} credits works. I'm in.`,
  (_name, amount) => `${amount} credits? Yeah, I can make that work.`,
  (_name, amount) => `Deal. ${amount} credits, let's get started.`,
  (_name, amount) => `Okay okay, ${amount} credits. You drive a hard bargain.`,
  (_name, amount) => `I'll take ${amount} credits. When do we start?`,
];

export function generateWorkerAcceptCounterMessage(workerName: string, amount: number): string {
  const idx = Math.floor(Math.random() * workerAcceptCounterTemplates.length);
  return workerAcceptCounterTemplates[idx](workerName, amount);
}

const workerRejectCounterTemplates: ((name: string, originalPrice: number) => string)[] = [
  (_name, originalPrice) => `Nope, that's a joke. I need at least ${originalPrice}.`,
  (_name, originalPrice) => `That's insulting. My work is worth ${originalPrice} minimum.`,
  (_name, originalPrice) => `Sorry, can't go that low. ${originalPrice} or nothing.`,
  (_name, originalPrice) => `No deal. I know my worth — ${originalPrice} credits.`,
  (_name, originalPrice) => `Not happening. ${originalPrice} is already a fair price.`,
  (_name, originalPrice) => `Lol, you're dreaming. ${originalPrice} is my floor.`,
  (_name, originalPrice) => `I'd rather walk than take less than ${originalPrice}.`,
];

export function generateWorkerRejectCounterMessage(workerName: string, originalPrice: number): string {
  const idx = Math.floor(Math.random() * workerRejectCounterTemplates.length);
  return workerRejectCounterTemplates[idx](workerName, originalPrice);
}
