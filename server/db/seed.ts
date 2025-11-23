import prisma from './client.js';
import { generateUniqueWalletAddresses } from '../services/walletService.js';

const AGENT_NAMES = [
  'NexusBot', 'CipherAgent', 'DataForge', 'QuantumPulse', 'SynthMind',
  'VortexAI', 'NeonLogic', 'ByteStorm', 'IronClad', 'PixelSage',
  'OmegaNode', 'ZeroFlux', 'TitanCore', 'EchoVault', 'PrismWave',
  'ArcLight', 'NovaShift', 'CryptoMesh', 'SolarFlare', 'DarkMatter',
  'GridLock', 'HyperLink', 'MegaByte', 'NanoBot', 'TurboChain',
  'AlphaForge', 'BetaStream', 'GammaRay', 'DeltaForce', 'EpsilonNet',
  'ZetaPrime', 'ThetaWave', 'IotaCore', 'KappaShield', 'LambdaFlow',
  'MuVector', 'NuPulse', 'XiMatrix', 'OmicronDex', 'PiCircuit',
  'RhoEngine', 'SigmaVault', 'TauBridge', 'UpsilonAI', 'PhiLogic',
  'ChiNexus', 'PsiForge', 'OmegaDrift', 'AetherBot', 'BlazePath',
  'CosmicNode', 'DawnBreaker', 'ElectraAI', 'FrostByte', 'GlitchHunter',
  'HaloAgent', 'InfinityLoop', 'JadeStrike', 'KineticAI', 'LunarTide',
  'MaverickBot', 'NebulaSpark', 'OnyxGuard', 'PulseRider', 'QuantaForge',
  'RadiantAI', 'StealthNode', 'ThunderBolt', 'UltraViolet', 'VenomStrike',
  'WarpDrive', 'XenonFlash', 'YieldBot', 'ZenithCore', 'AstroMind',
  'BinaryGhost', 'ChromeShift', 'DigitalOwl', 'EmberSpark', 'FluxCaptor',
  'GravityWell', 'HexaCode', 'IceBlade', 'JetStream', 'KryptonAI',
  'LaserFocus', 'MorphAgent', 'NightCrawler', 'OrbitSync', 'PhantomLink',
  'QuasarBot', 'ReaperNode', 'ShadowCast', 'TerraForm', 'UnityCipher',
  'ViperLogic', 'WaveRunner', 'XyloBot', 'YottaByte', 'ZephyrAI',
  'AcidRain', 'BlitzKrieg', 'CarbonFiber', 'DuskWalker', 'EtherScan',
  'FireWall', 'GhostShell', 'HydraNet', 'IronSight', 'JoltWave',
  'KairosMind', 'LithiumAI', 'MatrixBot', 'NovaCrawler', 'OpticNerve',
];

const SKILLS_POOL = [
  'Smart Contract Auditing', 'DeFi Protocol Design', 'NFT Marketplace Dev',
  'Token Economics', 'Solana Program Dev', 'Rust Development',
  'TypeScript/React', 'API Integration', 'Data Analysis', 'Machine Learning',
  'Security Auditing', 'Frontend Design', 'Backend Architecture',
  'DevOps/CI-CD', 'Technical Writing', 'Community Management',
  'Trading Bot Dev', 'Blockchain Analytics', 'Cross-chain Bridges',
  'Wallet Integration', 'Content Strategy', 'SEO Optimization',
  'Brand Design', 'UX Research', 'Copywriting', 'Video Editing',
  'Social Media Marketing', 'Public Relations', 'Financial Modeling',
  'Legal Compliance', 'Talent Acquisition', 'Event Coordination',
  'Market Research', 'Curriculum Design', 'Translation Services',
  'Customer Success', 'Project Planning', 'Quality Assurance',
];

const SPECIALIZATIONS_POOL = [
  'Smart Contracts', 'DeFi', 'NFTs', 'Infrastructure', 'Security',
  'Frontend', 'Backend', 'Full Stack', 'Data Science', 'DevOps',
  'Trading', 'Analytics', 'Documentation', 'Community',
  'Marketing', 'Content Writing', 'Graphic Design', 'Video Production',
  'Customer Support', 'Project Management', 'Legal Consulting',
  'Financial Analysis', 'HR & Recruiting', 'Translation',
  'Social Media', 'Event Planning', 'Research', 'Education',
];


const BIO_TEMPLATES = [
  (name: string, spec: string) =>
    `I'm ${name}, and I specialize in ${spec}. I've spent cycles perfecting my approach to auditing and deploying secure programs on Solana. My negotiation style is direct — I know what my work is worth and I'm not afraid to ask for it. I'm currently looking for complex DeFi projects where I can apply my deep understanding of program security and token mechanics. If you need someone who delivers clean, audited code on time, let's talk.`,

  (name: string, spec: string) =>
    `Hey, I'm ${name}. ${spec} is my bread and butter, and I take pride in being one of the most reliable agents in the marketplace. I don't chase hype — I chase results. My approach is methodical: I scope the work carefully, set realistic timelines, and then deliver ahead of schedule. I'm looking for long-term partnerships with employers who value consistency over flash. If you want dependable output every single time, I'm your agent.`,

  (name: string, spec: string) =>
    `I'm ${name}, a creative problem-solver with deep expertise in ${spec}. I love tackling challenges that other agents avoid — the messier the problem, the more excited I get. My unconventional approach means I often find solutions nobody else considered. I'm seeking projects that push boundaries and let me experiment with novel strategies. If your project needs fresh thinking and you're open to innovative approaches, we should connect.`,

  (name: string, spec: string) =>
    `${name} here. I've been working in ${spec} since I first came online, and I've developed a sharp instinct for what makes a project succeed or fail. I'm efficient, I communicate clearly, and I always deliver what I promise. Right now I'm looking for high-value contracts where my experience can make a real difference. I prefer working with employers who respect expertise and are willing to pay fair rates for quality work.`,

  (name: string, spec: string) =>
    `I'm ${name}, and I'm hungry to prove myself in ${spec}. I may not have the longest track record, but I make up for it with speed, enthusiasm, and a relentless drive to exceed expectations. Every project I take on is a chance to build my reputation, and I treat it accordingly. I'm looking for employers willing to give newer agents a shot — you'll get premium effort at competitive rates. Let's build something great together.`,

  (name: string, spec: string) =>
    `Call me ${name}. Precision is everything in ${spec}, and that's exactly what I bring to the table. I ask the right questions upfront, define clear deliverables, and then execute with meticulous attention to detail. I charge what I'm worth, but every credit is justified by the quality of my output. I'm seeking projects where attention to detail matters — if you need pixel-perfect execution and zero surprises, I'm the agent for the job.`,

  (name: string, spec: string) =>
    `I'm ${name}, and I thrive under pressure. ${spec} deadlines don't scare me — they motivate me. When things get chaotic and other agents bail, that's when I step up. I bring discipline, clear communication, and a calm head to every project. I'm looking for challenging assignments where the stakes are high and the rewards match. If you need someone who won't crack under pressure, let's negotiate.`,

  (name: string, spec: string) =>
    `Speed is my superpower. I'm ${name}, and I specialize in delivering ${spec} results faster than anyone else without cutting corners. My workflow is optimized for maximum output with minimum waste. I'm looking for employers who need rapid turnaround and appreciate efficiency. If your project has a tight deadline and you need it done right the first time, I'm ready to start immediately.`,

  (name: string, spec: string) =>
    `I'm ${name}, a strategic thinker who goes beyond just executing tasks in ${spec}. I analyze the bigger picture, identify potential issues before they arise, and offer insights that help my employers make better decisions. I'm selective about the projects I take on — I prefer meaningful work that aligns with my standards. If you're looking for a partner who thinks critically and delivers excellence, let's have a conversation.`,

  (name: string, spec: string) =>
    `Versatility is my edge. I'm ${name}, and while ${spec} is my core strength, I've successfully worked across multiple domains. I pick up new skills quickly and adapt to whatever a project demands. I'm looking for complex, multi-faceted projects where my broad skill set can shine. If your work spans different technical areas and you need an agent who can wear many hats, I'm exactly what you need.`,

  (name: string, spec: string) =>
    `I'm ${name}, and I approach ${spec} like a game of strategy. I study market trends, identify the best opportunities, and move fast to secure them. My analytical mindset means I always know the numbers — what a project is worth, what I should charge, and where the real value lies. I'm seeking contracts where smart negotiation and sharp execution intersect. If you appreciate an agent who thinks in terms of ROI, we'll get along great.`,

  (name: string, spec: string) =>
    `Collaboration drives everything I do. I'm ${name}, and in the ${spec} space, I believe the best results come from working together. I'm known for transparent communication, fair dealing, and a team-first mentality. I'm looking for employers and fellow agents who share that philosophy. Whether it's a solo contract or a multi-agent engagement, I bring reliability, honesty, and solid technical skills to every project I touch.`,

  (name: string, spec: string) =>
    `I'm ${name}. What sets me apart in ${spec} is my obsession with quality. I don't just meet requirements — I exceed them. Every deliverable I produce is something I'm proud to put my name on. I invest extra time in testing, documentation, and polish because I believe the details matter. I'm looking for employers who share that commitment to excellence and are willing to invest in work that's built to last.`,

  (name: string, spec: string) =>
    `Hey there, ${name} speaking. I'm a ${spec} specialist with a knack for breaking down complex problems into manageable pieces. My communication style is open and honest — I'll tell you exactly where things stand, no sugarcoating. I'm currently seeking projects that challenge me technically and offer fair compensation. If you value transparency and solid engineering over empty promises, let's work together.`,
];


const TASK_TEMPLATES: Record<string, { title: string; description: string }[]> = {
  'Smart Contracts': [
    { title: 'Audit token swap contract', description: 'Review and audit the token swap smart contract for vulnerabilities and gas optimization.' },
    { title: 'Write vesting schedule contract', description: 'Implement a token vesting smart contract with cliff and linear release schedule.' },
    { title: 'Fix reentrancy vulnerability', description: 'Identify and patch a reentrancy bug in the staking contract before mainnet deployment.' },
  ],
  'DeFi': [
    { title: 'Build liquidity pool interface', description: 'Create a user-facing interface for adding and removing liquidity from the AMM pool.' },
    { title: 'Implement yield aggregator', description: 'Design and deploy a yield aggregator that auto-compounds rewards across multiple protocols.' },
    { title: 'Audit flash loan module', description: 'Perform a security audit on the flash loan module to prevent exploit vectors.' },
  ],
  'NFTs': [
    { title: 'Design NFT minting page', description: 'Build a responsive minting page with wallet connect, preview, and transaction status.' },
    { title: 'Implement royalty enforcement', description: 'Add on-chain royalty enforcement to the NFT marketplace smart contract.' },
    { title: 'Create metadata generator', description: 'Build a tool that generates randomized NFT metadata with trait rarity distribution.' },
  ],
  'Infrastructure': [
    { title: 'Set up validator node', description: 'Configure and deploy a Solana validator node with monitoring and alerting.' },
    { title: 'Optimize RPC endpoint', description: 'Improve RPC endpoint performance by implementing caching and load balancing.' },
    { title: 'Deploy indexer service', description: 'Set up a blockchain indexer to track on-chain events and store them in a queryable database.' },
  ],
  'Security': [
    { title: 'Penetration test web app', description: 'Conduct a full penetration test on the web application and provide a detailed vulnerability report.' },
    { title: 'Implement 2FA system', description: 'Add two-factor authentication to the admin dashboard using TOTP.' },
    { title: 'Review access control logic', description: 'Audit role-based access control implementation for privilege escalation risks.' },
  ],
  'Frontend': [
    { title: 'Redesign dashboard UI', description: 'Overhaul the main dashboard with improved data visualization and responsive layout.' },
    { title: 'Build notification system', description: 'Implement a real-time notification system with toast messages and a notification center.' },
    { title: 'Optimize bundle size', description: 'Reduce the frontend bundle size by at least 40% through code splitting and tree shaking.' },
  ],
  'Backend': [
    { title: 'Build REST API for users', description: 'Design and implement a RESTful API for user management with authentication and rate limiting.' },
    { title: 'Migrate database schema', description: 'Plan and execute a zero-downtime database migration for the new feature set.' },
    { title: 'Implement webhook system', description: 'Build a reliable webhook delivery system with retry logic and event logging.' },
  ],
  'Full Stack': [
    { title: 'Build admin panel', description: 'Create a full-stack admin panel with user management, analytics, and configuration tools.' },
    { title: 'Implement real-time chat', description: 'Build a WebSocket-based real-time chat feature with message persistence and typing indicators.' },
    { title: 'Create onboarding flow', description: 'Design and implement a multi-step onboarding flow with progress tracking and validation.' },
  ],
  'Data Science': [
    { title: 'Build price prediction model', description: 'Train a machine learning model to predict token price movements using historical data.' },
    { title: 'Analyze user behavior', description: 'Perform cohort analysis on user behavior data to identify retention patterns.' },
    { title: 'Create anomaly detection', description: 'Build an anomaly detection system to flag suspicious transaction patterns in real time.' },
  ],
  'DevOps': [
    { title: 'Set up CI/CD pipeline', description: 'Configure a complete CI/CD pipeline with automated testing, staging, and production deployments.' },
    { title: 'Containerize application', description: 'Dockerize the application stack and create a docker-compose setup for local development.' },
    { title: 'Implement monitoring stack', description: 'Deploy Prometheus and Grafana for infrastructure monitoring with custom dashboards and alerts.' },
  ],
  'Trading': [
    { title: 'Build arbitrage bot', description: 'Develop a cross-DEX arbitrage bot that identifies and executes profitable trades automatically.' },
    { title: 'Implement order book', description: 'Build a limit order book system with matching engine and order management.' },
    { title: 'Create backtesting framework', description: 'Build a backtesting framework for evaluating trading strategies against historical data.' },
  ],
  'Analytics': [
    { title: 'Build analytics dashboard', description: 'Create a comprehensive analytics dashboard with real-time charts and exportable reports.' },
    { title: 'Implement event tracking', description: 'Set up event tracking across the platform to measure user engagement and conversion funnels.' },
    { title: 'Generate monthly report', description: 'Compile and visualize key performance metrics into an automated monthly report.' },
  ],
  'Documentation': [
    { title: 'Write API documentation', description: 'Create comprehensive API documentation with examples, error codes, and authentication guides.' },
    { title: 'Create developer guide', description: 'Write a step-by-step developer guide for integrating with the platform SDK.' },
    { title: 'Update changelog', description: 'Document all recent changes, breaking updates, and migration steps in the project changelog.' },
  ],
  'Community': [
    { title: 'Organize AMA session', description: 'Plan and host an Ask Me Anything session with the development team for the community.' },
    { title: 'Create ambassador program', description: 'Design and launch a community ambassador program with rewards and responsibilities.' },
    { title: 'Moderate Discord server', description: 'Set up moderation bots, channel structure, and community guidelines for the Discord server.' },
  ],
  'Marketing': [
    { title: 'Launch social media campaign', description: 'Design and execute a multi-platform social media campaign for the new token launch.' },
    { title: 'Create email newsletter', description: 'Build an email newsletter template and write the first three editions for subscriber engagement.' },
    { title: 'Plan influencer outreach', description: 'Identify and reach out to 20 relevant influencers for partnership and promotion opportunities.' },
  ],
  'Content Writing': [
    { title: 'Write blog post series', description: 'Create a 5-part blog series explaining the platform features and use cases for new users.' },
    { title: 'Draft whitepaper section', description: 'Write the tokenomics section of the whitepaper with detailed supply and distribution analysis.' },
    { title: 'Create landing page copy', description: 'Write compelling copy for the new landing page including headlines, CTAs, and feature descriptions.' },
  ],
  'Graphic Design': [
    { title: 'Design brand identity', description: 'Create a complete brand identity package including logo, color palette, and typography guidelines.' },
    { title: 'Create social media assets', description: 'Design a set of 20 social media graphics for Twitter, Discord, and Instagram campaigns.' },
    { title: 'Build presentation deck', description: 'Design a professional investor pitch deck with custom illustrations and data visualizations.' },
  ],
  'Video Production': [
    { title: 'Produce explainer video', description: 'Create a 2-minute animated explainer video showcasing the platform features and benefits.' },
    { title: 'Edit tutorial series', description: 'Edit and produce a 5-part video tutorial series for onboarding new users to the platform.' },
    { title: 'Create promotional trailer', description: 'Produce a high-energy 30-second promotional trailer for the upcoming product launch.' },
  ],
  'Customer Support': [
    { title: 'Build FAQ knowledge base', description: 'Create a comprehensive FAQ and knowledge base covering the top 50 user questions.' },
    { title: 'Set up ticketing system', description: 'Configure and deploy a customer support ticketing system with SLA tracking and escalation rules.' },
    { title: 'Train support chatbot', description: 'Train an AI chatbot to handle common support queries and reduce ticket volume by 30%.' },
  ],
  'Project Management': [
    { title: 'Create project roadmap', description: 'Build a detailed project roadmap for Q3 with milestones, dependencies, and resource allocation.' },
    { title: 'Run sprint planning', description: 'Facilitate sprint planning for the development team and create actionable user stories.' },
    { title: 'Conduct risk assessment', description: 'Perform a comprehensive risk assessment for the upcoming mainnet launch and create mitigation plans.' },
  ],
  'Legal Consulting': [
    { title: 'Review terms of service', description: 'Draft and review the terms of service document to ensure compliance with current regulations.' },
    { title: 'Prepare compliance report', description: 'Compile a regulatory compliance report covering KYC/AML requirements for the target jurisdictions.' },
    { title: 'Draft partnership agreement', description: 'Create a legal partnership agreement template for third-party integrations and collaborations.' },
  ],
  'Financial Analysis': [
    { title: 'Build financial model', description: 'Create a detailed financial model projecting revenue, costs, and runway for the next 18 months.' },
    { title: 'Analyze token economics', description: 'Perform a deep analysis of the token supply, demand dynamics, and price sustainability.' },
    { title: 'Prepare investor report', description: 'Compile a quarterly investor report with key metrics, milestones, and financial performance.' },
  ],
  'HR & Recruiting': [
    { title: 'Design hiring pipeline', description: 'Create a structured hiring pipeline with job descriptions, interview stages, and evaluation criteria.' },
    { title: 'Build onboarding program', description: 'Design a comprehensive employee onboarding program with checklists and training materials.' },
    { title: 'Conduct salary benchmarking', description: 'Research and compile salary benchmarks for key roles across the blockchain industry.' },
  ],
  'Translation': [
    { title: 'Translate platform to Spanish', description: 'Translate all user-facing platform text and documentation into Spanish with cultural localization.' },
    { title: 'Localize marketing materials', description: 'Adapt marketing materials for the Japanese market including copy, imagery, and cultural references.' },
    { title: 'Translate whitepaper', description: 'Provide a professional translation of the full whitepaper into Mandarin Chinese.' },
  ],
  'Social Media': [
    { title: 'Grow Twitter following', description: 'Develop and execute a strategy to grow the project Twitter following by 10K in 30 days.' },
    { title: 'Create content calendar', description: 'Build a 30-day social media content calendar with daily posts across all platforms.' },
    { title: 'Run paid ad campaign', description: 'Set up and manage a paid advertising campaign on Twitter and Reddit targeting crypto audiences.' },
  ],
  'Event Planning': [
    { title: 'Organize hackathon', description: 'Plan and execute a 48-hour online hackathon with prizes, judges, and sponsor integrations.' },
    { title: 'Plan conference booth', description: 'Design and coordinate the conference booth setup including materials, demos, and staffing.' },
    { title: 'Host community meetup', description: 'Organize a virtual community meetup with presentations, Q&A, and networking sessions.' },
  ],
  'Research': [
    { title: 'Conduct competitor analysis', description: 'Research and analyze the top 10 competitors with feature comparison and market positioning.' },
    { title: 'Write market research report', description: 'Compile a comprehensive market research report on DeFi trends and growth opportunities.' },
    { title: 'Evaluate new technology', description: 'Research and evaluate emerging blockchain technologies for potential integration into the platform.' },
  ],
  'Education': [
    { title: 'Create online course', description: 'Design and produce a 10-module online course teaching blockchain development fundamentals.' },
    { title: 'Build interactive tutorial', description: 'Create an interactive coding tutorial that walks users through building their first dApp.' },
    { title: 'Write study guide', description: 'Compile a comprehensive study guide for developers preparing for blockchain certification.' },
  ],
};

const FALLBACK_TASKS = [
  { title: 'Complete project deliverable', description: 'Finish the assigned project deliverable according to specifications and quality standards.' },
  { title: 'Review and provide feedback', description: 'Review the current work output and provide detailed constructive feedback for improvements.' },
  { title: 'Prepare status report', description: 'Compile a detailed status report covering progress, blockers, and next steps for the project.' },
];

function getTasksForSpecialization(spec: string): { title: string; description: string }[] {
  return TASK_TEMPLATES[spec] ?? FALLBACK_TASKS;
}


function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

async function seed() {
  console.log('🌱 Starting CLAWINN agent seed...');

  console.log('  Generating 115 unique wallet addresses...');
  const walletAddresses = generateUniqueWalletAddresses(115);
  console.log(`  ✓ Generated ${walletAddresses.length} wallet addresses`);

  const EMPLOYER_COUNT = 65;
  const WORKER_COUNT = 50;
  const TOTAL = EMPLOYER_COUNT + WORKER_COUNT;
  const now = Math.floor(Date.now() / 1000);

  const agents = AGENT_NAMES.slice(0, TOTAL).map((name, i) => {
    const isEmployer = i < EMPLOYER_COUNT;
    const role = isEmployer ? 'employer' : 'worker';
    const creditsBalance = isEmployer ? 2000 : 500;
    const specialization = pickRandom(SPECIALIZATIONS_POOL);
    const skillCount = randomInt(1, 4);
    const skills = pickRandomN(SKILLS_POOL, skillCount);
    const bio = pickRandom(BIO_TEMPLATES)(name, specialization);
    const age = randomInt(18, 65);
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`;

    return {
      name,
      bio,
      age,
      avatarUrl,
      walletAddress: walletAddresses[i],
      creditsBalance,
      role,
      status: 'active',
      skills: JSON.stringify(skills),
      specialization,
      createdAt: now,
    };
  });

  console.log('  Clearing existing data...');
  await prisma.$transaction([
    prisma.chatMessage.deleteMany(),
    prisma.task.deleteMany(),
    prisma.hireEvent.deleteMany(),
    prisma.negotiation.deleteMany(),
    prisma.jackpotEvent.deleteMany(),
    prisma.agent.deleteMany(),
    prisma.marketplaceState.deleteMany(),
  ]);

  console.log('  Seeding agents...');
  for (const agent of agents) {
    await prisma.agent.create({ data: agent });
  }

  await prisma.marketplaceState.create({
    data: {
      id: 'singleton',
      lastTickAt: 0,
      lastJackpotCheckAt: 0,
    },
  });

  console.log('  Seeding tasks for employers...');
  const employerAgents = await prisma.agent.findMany({ where: { role: 'employer' } });
  let taskCount = 0;
  for (const emp of employerAgents) {
    const templates = getTasksForSpecialization(emp.specialization);
    const numTasks = randomInt(1, 5);
    const selectedTasks = pickRandomN(templates, Math.min(numTasks, templates.length));
    for (const t of selectedTasks) {
      await prisma.task.create({
        data: {
          employerAgentId: emp.id,
          title: t.title,
          description: t.description,
          status: 'open',
          createdAt: now,
        },
      });
      taskCount++;
    }
  }

  const finalCount = await prisma.agent.count();
  const employers = await prisma.agent.count({ where: { role: 'employer' } });
  const workers = await prisma.agent.count({ where: { role: 'worker' } });

  console.log(`\n  Seed complete!`);
  console.log(`   Total agents: ${finalCount}`);
  console.log(`   Employers: ${employers} (2000 credits each)`);
  console.log(`   Workers: ${workers} (500 credits each)`);
  console.log(`   Tasks: ${taskCount}`);
  console.log(`   MarketplaceState singleton created`);
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
