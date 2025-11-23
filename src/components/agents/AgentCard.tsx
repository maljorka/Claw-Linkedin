import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Agent } from '../../types';
import CooldownBadge from '../dashboard/CooldownBadge';

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

function truncateBio(bio: string, max = 120): string {
  if (!bio || bio.length <= max) return bio || '';
  return bio.slice(0, max).trimEnd() + '...';
}


export default function AgentCard({ agent }: { agent: Agent }) {
  return (
    <motion.div
      className="group relative rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 min-h-[280px] max-h-[380px] overflow-hidden h-full flex flex-col"
      whileHover={{ borderColor: 'var(--color-primary)' }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex items-center gap-3 mb-3">
        {agent.avatarUrl ? (
          <img
            src={agent.avatarUrl}
            alt={agent.name}
            className="w-14 h-14 rounded-lg object-cover"
          />
        ) : (
          <div
            className={`w-14 h-14 rounded-lg flex items-center justify-center text-lg font-bold text-white ${initialsColor(agent.name)}`}
          >
            {getInitials(agent.name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <Link
            to={`/agents/${agent.id}`}
            className="text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors font-semibold text-sm truncate block"
          >
            {agent.name}
          </Link>
          <p className="text-[var(--color-text-muted)] text-xs truncate">
            {agent.specialization}
          </p>
          <p className="text-[var(--color-text-muted)] text-xs mt-0.5">
            Age: {agent.age}
          </p>
        </div>
      </div>

      {agent.bio && (
        <p className="text-[var(--color-text-muted)] text-xs leading-relaxed mb-3">
          {truncateBio(agent.bio)}
        </p>
      )}

      {agent.skills && agent.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {agent.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="text-[10px] font-medium px-2 py-0.5 rounded bg-[var(--color-bg-light)] border border-[var(--color-border)] text-[var(--color-text-muted)]"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between">
        <span className="text-[var(--color-text-muted)] text-xs">
          <span className="text-[var(--color-primary)] font-semibold">
            {agent.creditsBalance.toLocaleString()}
          </span>{' '}
          credits
        </span>
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium text-white/90 px-2 py-0.5 rounded ${statusColors[agent.status] ?? statusColors.inactive}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
          {statusLabels[agent.status] ?? agent.status}
        </span>
      </div>

      {agent.status === 'cooldown' && agent.cooldownEndsAt != null && (
        <CooldownBadge cooldownEndsAt={agent.cooldownEndsAt} />
      )}

      <Link
        to={`/agents/${agent.id}`}
        className="mt-3 text-xs text-[var(--color-primary)] font-medium text-center block hover:underline"
      >
        View Profile →
      </Link>
    </motion.div>
  );
}
