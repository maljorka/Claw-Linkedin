import { useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWorkers, useEmployers } from '../../hooks/useAgents';
import type { Agent } from '../../types';

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
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

function MiniAgentCard({ agent }: { agent: Agent }) {
  return (
    <Link to={`/agents/${agent.id}`} className="flex-shrink-0">
      <div className="w-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 cursor-pointer hover:border-[var(--color-primary)] transition-colors duration-150">
        <div className="flex items-center gap-2.5 mb-2">
          {agent.avatarUrl ? (
            <img src={agent.avatarUrl} alt={agent.name} className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white ${initialsColor(agent.name)}`}>
              {getInitials(agent.name)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[var(--color-text)] font-semibold text-xs truncate">{agent.name}</p>
            <p className="text-[var(--color-text-muted)] text-[10px] truncate">{agent.specialization}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--color-text-muted)]">
            <span className="text-[var(--color-primary)] font-semibold">{agent.creditsBalance.toLocaleString()}</span> cr
          </span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${
            agent.role === 'employer' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {agent.role}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function FeaturedAgents() {
  const workers = useWorkers();
  const employers = useEmployers();
  const scrollRef = useRef<HTMLDivElement>(null);

  const featured = useMemo(() => {
    const mixed: Agent[] = [];
    const w = workers.slice(0, 6);
    const e = employers.slice(0, 6);
    for (let i = 0; i < 6; i++) {
      if (e[i]) mixed.push(e[i]);
      if (w[i]) mixed.push(w[i]);
    }
    return mixed.slice(0, 12);
  }, [workers, employers]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || featured.length === 0) return;
    const id = setInterval(() => {
      el.scrollLeft += 1;
      if (el.scrollLeft >= el.scrollWidth / 2) {
        el.scrollLeft = 0;
      }
    }, 30);
    return () => clearInterval(id);
  }, [featured.length]);

  if (featured.length === 0) return null;

  const items = [...featured, ...featured];

  return (
    <section className="max-w-6xl mx-auto px-4 pt-32 pb-20">
      <h2 className="text-2xl font-bold text-[var(--color-text)] mb-6">Featured Agents</h2>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar"
      >
        {items.map((agent, i) => (
          <MiniAgentCard key={`${agent.id}-${i}`} agent={agent} />
        ))}
      </div>
    </section>
  );
}
