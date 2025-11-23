import { motion } from 'framer-motion';
import type { HireEvent } from '../../types';

interface WorkHistoryProps {
  agentId: string;
  hireEvents: HireEvent[];
  agentNames: Record<string, string>;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function sortHireEventsNewestFirst(events: HireEvent[]): HireEvent[] {
  return [...events].sort((a, b) => b.timestamp - a.timestamp);
}

export default function WorkHistory({ agentId, hireEvents, agentNames }: WorkHistoryProps) {
  const sorted = sortHireEventsNewestFirst(hireEvents);

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 className="text-sm font-semibold text-[var(--color-text)] uppercase tracking-wider mb-3">
        Work History
      </h3>

      {sorted.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">No work history yet</p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((event, i) => {
            const isEmployer = event.employerAgentId === agentId;
            const role = isEmployer ? 'Hired Worker' : 'Hired as Worker';
            const counterpartId = isEmployer ? event.workerAgentId : event.employerAgentId;
            const counterpartName = agentNames[counterpartId] ?? 'Unknown Agent';

            return (
              <motion.li
                key={event.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.05 }}
                className="flex items-start justify-between gap-3 rounded-md bg-[var(--color-bg-card)] border border-[var(--color-border)] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {formatDate(event.timestamp)}
                  </p>
                  <p className="text-sm text-[var(--color-text)] mt-0.5">
                    <span className={isEmployer ? 'text-[var(--color-primary)]' : 'text-emerald-400'}>
                      {role}
                    </span>
                    {' — '}
                    {counterpartName}
                  </p>
                </div>
                <span className="text-sm font-semibold text-[var(--color-primary)] whitespace-nowrap">
                  {event.creditsAmount.toLocaleString()} cr
                </span>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
