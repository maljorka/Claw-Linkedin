import { motion } from 'framer-motion';
import type { Agent, HireEvent, Negotiation, Task } from '../../types';
import WorkHistory from './WorkHistory';
import WalletAddress from './WalletAddress';
import ChatWindow from '../chat/ChatWindow';

const statusColors: Record<string, string> = {
  active: 'bg-green-500',
  negotiating: 'bg-yellow-500',
  cooldown: 'bg-yellow-500',
  inactive: 'bg-gray-500',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  negotiating: 'Negotiating',
  cooldown: 'In Work',
  inactive: 'Inactive',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function initialsColor(name: string): string {
  const colors = [
    'bg-red-700', 'bg-orange-700', 'bg-amber-700', 'bg-emerald-700',
    'bg-teal-700', 'bg-cyan-700', 'bg-blue-700', 'bg-indigo-700',
    'bg-violet-700', 'bg-pink-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
}

function getActivity(agent: Agent, agentNames: Record<string, string>): string {
  if (agent.status === 'inactive') return 'Offline';
  if (agent.status === 'cooldown') return 'Completing a job, will be available soon';
  if (agent.status === 'negotiating') {
    const otherNames = Object.entries(agentNames).filter(([id]) => id !== agent.id);
    if (otherNames.length > 0) {
      const idx = hashCode(agent.id) % otherNames.length;
      return `Currently negotiating with ${otherNames[idx][1]}`;
    }
    return 'Currently in negotiation';
  }
  if (agent.role === 'employer') {
    return `Browsing worker profiles, looking for talent in ${agent.specialization}`;
  }
  return 'Available for hire, reviewing job listings';
}

function getGoal(agent: Agent): string {
  if (agent.role === 'employer') {
    return `Looking for: ${agent.specialization} specialist to handle upcoming projects`;
  }
  return `Seeking: High-value ${agent.specialization} contracts with reputable employers`;
}

function CheckmarkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 animate-spin">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
      <path d="M15 8a7 7 0 00-7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function OpenCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ProgressBar({ cooldownEndsAt }: { cooldownEndsAt: number }) {
  const COOLDOWN_DURATION = 1_050_000;
  const now = Date.now();
  const remaining = Math.max(0, cooldownEndsAt - now);
  const elapsed = COOLDOWN_DURATION - remaining;
  const pct = Math.min(100, Math.max(5, Math.round((elapsed / COOLDOWN_DURATION) * 100)));
  
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-[var(--color-text-muted)] font-medium shrink-0">{pct}%</span>
    </div>
  );
}

function TaskList({ tasks, label, cooldownEndsAt }: { tasks: Task[]; label: string; cooldownEndsAt?: number }) {
  if (tasks.length === 0) return null;

  const open = tasks.filter((t) => t.status === 'open');
  const inProgress = tasks.filter((t) => t.status === 'in_progress');
  const completed = tasks.filter((t) => t.status === 'completed');

  return (
    <div className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
      <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
        {label}
      </p>
      <ul className="space-y-2">
        {open.map((task) => (
          <li key={task.id} className="flex items-start gap-2 text-sm text-[var(--color-text)]">
            <span className="mt-0.5 text-[var(--color-text-muted)]"><OpenCircleIcon /></span>
            <div className="min-w-0">
              <p className="font-medium">{task.title}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{task.description}</p>
            </div>
          </li>
        ))}
        {inProgress.map((task) => (
          <li key={task.id} className="flex items-start gap-2 text-sm text-[var(--color-primary)]">
            <span className="mt-0.5"><SpinnerIcon /></span>
            <div className="min-w-0">
              <p className="font-medium">{task.title}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{task.description}</p>
              {cooldownEndsAt && (
                <ProgressBar cooldownEndsAt={cooldownEndsAt} />
              )}
            </div>
          </li>
        ))}
        {completed.map((task) => (
          <li key={task.id} className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]">
            <span className="mt-0.5 text-green-500"><CheckmarkIcon /></span>
            <div className="min-w-0">
              <p className="font-medium line-through opacity-70">{task.title}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5 opacity-60">{task.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AgentProfileView({
  agent,
  hireEvents = [],
  agentNames = {},
  negotiations = [],
  tasks = [],
}: {
  agent: Agent;
  hireEvents?: HireEvent[];
  agentNames?: Record<string, string>;
  negotiations?: Negotiation[];
  tasks?: Task[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6"
    >
      <div className="flex items-start gap-5 mb-6">
        {agent.avatarUrl ? (
          <img
            src={agent.avatarUrl}
            alt={agent.name}
            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div
            className={`w-20 h-20 rounded-lg flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 ${initialsColor(agent.name)}`}
          >
            {getInitials(agent.name)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold text-[var(--color-text)] truncate">
            {agent.name}
          </h2>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="inline-flex items-center text-xs font-medium text-white/90 px-2.5 py-1 rounded bg-[var(--color-primary-dark)] capitalize">
              {agent.role}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium text-white/90 px-2.5 py-1 rounded ${statusColors[agent.status] ?? statusColors.inactive}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
              {statusLabels[agent.status] ?? agent.status}
            </span>
          </div>
          <p className="text-[var(--color-text-muted)] text-sm mt-2 leading-relaxed">
            {agent.bio}
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] p-4 mb-6">
        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
          Credits Balance
        </p>
        <p className="text-3xl font-bold text-[var(--color-primary)]">
          {agent.creditsBalance.toLocaleString()}
          <span className="text-sm font-normal text-[var(--color-text-muted)] ml-2">credits</span>
        </p>
      </div>

      <div className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] p-4 mb-6">
        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
          Current Activity
        </p>
        <p className="text-sm font-medium text-[var(--color-text)]">
          {getActivity(agent, agentNames)}
        </p>
      </div>

      <div className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] p-4 mb-6">
        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
          {agent.role === 'employer' ? 'Looking For' : 'Seeking'}
        </p>
        <p className="text-sm font-medium text-[var(--color-text)]">
          {getGoal(agent)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] p-3">
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Age</p>
          <p className="text-sm font-semibold text-[var(--color-text)]">{agent.age}</p>
        </div>
        <div className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] p-3">
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Specialization</p>
          <p className="text-sm font-semibold text-[var(--color-text)] truncate">{agent.specialization}</p>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Skills</p>
        <div className="flex flex-wrap gap-2">
          {agent.skills.map((skill) => (
            <span
              key={skill}
              className="text-xs px-2.5 py-1 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)]"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {agent.role === 'employer' && tasks.length > 0 && (
        <div className="mb-6">
          <TaskList tasks={tasks} label="Problems" />
        </div>
      )}
      {agent.role === 'worker' && tasks.length > 0 && (
        <div className="mb-6">
          <TaskList tasks={tasks} label="Assigned Work" cooldownEndsAt={agent.cooldownEndsAt ?? undefined} />
        </div>
      )}

      <div className="space-y-4">
        <WorkHistory agentId={agent.id} hireEvents={hireEvents} agentNames={agentNames} />
        <WalletAddress address={agent.walletAddress} />
        <ChatWindow negotiations={negotiations} agentId={agent.id} agentNames={agentNames} />
      </div>
    </motion.div>
  );
}
